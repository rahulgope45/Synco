package expo.modules.syncohost

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.java_websocket.WebSocket
import org.java_websocket.WebSocketImpl
import org.java_websocket.drafts.Draft_6455
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.net.Inet4Address
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.nio.ByteBuffer
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

/** Bounded control transport only. Protocol and admission policy live in TypeScript. */
class SyncoHostModule : Module() {
  private var server: WebSocketServer? = null
  private val clients = ConcurrentHashMap<String, WebSocket>()
  private val ids = AtomicInteger()

  override fun definition() = ModuleDefinition {
    Name("SyncoHost")
    Events("onOpen", "onMessage", "onClose", "onHostError", "onStopped")
    Function("addresses") { localAddresses() }
    Function("sessionToken") {
      val bytes = ByteArray(16)
      SecureRandom().nextBytes(bytes)
      bytes.joinToString("") { "%02x".format(it.toInt() and 255) }
    }
    AsyncFunction("start") { ip: String, port: Int -> startHost(ip, port) }
    AsyncFunction("send") { id: String, text: String ->
      require(text.toByteArray(Charsets.UTF_8).size <= 4096) { "Control message too large" }
      val client = clients[id] ?: error("Guest disconnected")
      if (pendingBytes(client) > 65536) { client.close(1008, "Slow guest"); error("Guest is not keeping up") }
      client.send(text)
    }
    AsyncFunction("closeClient") { id: String -> clients[id]?.close(1008, "Session rejected or ended") }
    // IDs are selected by the TS admission policy. A slow listener drops a frame;
    // it must not disconnect all live listeners or grow an unbounded send queue.
    Function("sendLive") { readyIds: List<String>, text: String ->
      require(text.toByteArray(Charsets.UTF_8).size <= 4096)
      readyIds.forEach { id ->
        val client = clients[id]
        if (client != null && client.isOpen && pendingBytes(client) < 16384) {
          try { client.send(text) } catch (_: Exception) { client.close() }
        }
      }
    }
    AsyncFunction("stop") { stopHost() }
    OnActivityEntersBackground { if (CaptureProbeService.status["running"] != true) stopHost() }
    OnDestroy { stopHost() }
  }

  private fun pendingBytes(client: WebSocket): Int =
    (client as? WebSocketImpl)?.outQueue?.sumOf { it.remaining() } ?: 65537

  private fun localAddresses(): List<String> = NetworkInterface.getNetworkInterfaces().toList()
    .filter { it.isUp && !it.isLoopback }
    .sortedBy { if (it.name.startsWith("wlan") || it.name.startsWith("ap")) 0 else 1 }
    .flatMap { it.inetAddresses.toList() }
    .filter { it is Inet4Address && it.isSiteLocalAddress && !it.isLoopbackAddress }
    .mapNotNull { it.hostAddress }.distinct()

  @Synchronized private fun startHost(ip: String, port: Int) {
    check(server == null) { "Host already running" }
    require(ip in localAddresses()) { "Select a local Wi-Fi/hotspot address" }
    require(port in 1024..65535) { "Invalid port" }
    val ready = CountDownLatch(1)
    val failure = AtomicReference<Exception?>()
    val host = object : WebSocketServer(InetSocketAddress(ip, port), 1, listOf(Draft_6455(emptyList(), 4096))) {
      private val rates = ConcurrentHashMap<WebSocket, Pair<Long, Int>>()
      override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
        synchronized(clients) {
          if (clients.size >= 8) { conn.close(1013, "Host full"); return }
          val id = ids.incrementAndGet().toString()
          clients[id] = conn
          sendEvent("onOpen", mapOf("id" to id))
        }
      }
      override fun onMessage(conn: WebSocket, message: String) {
        val id = clients.entries.firstOrNull { it.value === conn }?.key ?: return
        val now = System.nanoTime() / 1000000
        val old = rates[conn]
        val rate = if (old == null || now - old.first >= 1000) Pair(now, 1) else Pair(old.first, old.second + 1)
        rates[conn] = rate
        if (rate.second > 30 || message.toByteArray(Charsets.UTF_8).size > 4096) {
          conn.close(1008, "Control limit exceeded"); return
        }
        sendEvent("onMessage", mapOf("id" to id, "text" to message))
      }
      override fun onMessage(conn: WebSocket, message: ByteBuffer) { conn.close(1003, "Text controls only") }
      override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) {
        rates.remove(conn)
        val id = clients.entries.firstOrNull { it.value === conn }?.key ?: return
        clients.remove(id)
        sendEvent("onClose", mapOf("id" to id))
      }
      override fun onError(conn: WebSocket?, ex: Exception) {
        if (conn == null) {
          failure.set(ex); ready.countDown()
          sendEvent("onHostError", mapOf("message" to "Phone host socket failed"))
        } else conn.close(1011, "Connection failed")
      }
      override fun onStart() { ready.countDown() }
    }
    host.setReuseAddr(true)
    host.setConnectionLostTimeout(15)
    server = host
    try {
      host.start()
      check(ready.await(5, TimeUnit.SECONDS)) { "Host startup timed out" }
      failure.get()?.let { throw it }
    } catch (error: Exception) { stopHost(); throw error }
  }

  @Synchronized private fun stopHost() {
    val host = server ?: return
    server = null
    host.stop(1000)
    clients.clear()
    sendEvent("onStopped", emptyMap<String, Any>())
  }
}
