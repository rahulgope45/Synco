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
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

/** Bounded control transport only. Protocol and admission policy live in TypeScript. */
class SyncoHostModule : Module() {
  private var server: WebSocketServer? = null
  private val clients = ConcurrentHashMap<String, WebSocket>()
  private val readyClients = ConcurrentHashMap<String, WebSocket>()
  private val audioQueue = ArrayBlockingQueue<ByteBuffer>(8)
  @Volatile private var audioActive = false
  @Volatile private var streaming = false
  private var audioWorker: Thread? = null
  private val audioEpoch = AtomicInteger()
  private val audioSent = AtomicInteger()
  private val audioDropped = AtomicInteger()
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
    Function("setAudioReady") { id: String, ready: Boolean ->
      val client = clients[id]
      if (ready && client != null && client.isOpen) readyClients[id] = client else readyClients.remove(id)
    }
    Function("beginAudioStream") { streaming = false; audioQueue.clear(); audioEpoch.set(SecureRandom().nextInt().ushr(1)); streaming = true }
    Function("endAudioStream") { streaming = false; audioQueue.clear() }
    Function("audioMetrics") { mapOf("sent" to audioSent.get(), "dropped" to audioDropped.get(), "queued" to audioQueue.size) }
    AsyncFunction("stop") { stopHost() }
    OnActivityEntersBackground { if (CaptureProbeService.status["running"] != true) stopHost() }
    OnDestroy { stopHost() }
  }

  private fun pendingBytes(client: WebSocket): Int =
    (client as? WebSocketImpl)?.outQueue?.sumOf { it.remaining() } ?: 65537

  private fun offerAudio(pcm: ByteArray, sequence: Long, samplePosition: Long) {
    if (!audioActive || !streaming) return
    val packet = AudioWire.encode(audioEpoch.get().toLong() and 0xffffffffL,
      sequence and 0xffffffffL, samplePosition and 0xffffffffL, pcm)
    if (!audioQueue.offer(packet)) { audioQueue.poll(); audioDropped.incrementAndGet(); audioQueue.offer(packet) }
  }

  private fun startAudioWorker() {
    audioSent.set(0); audioDropped.set(0); audioQueue.clear(); streaming = false; audioActive = true
    CaptureProbeService.frameSink = ::offerAudio
    audioWorker = Thread {
      while (audioActive) {
        val packet = try { audioQueue.poll(200, TimeUnit.MILLISECONDS) } catch (_: InterruptedException) { null } ?: continue
        if (!streaming || packet.getInt(8) != audioEpoch.get()) continue
        readyClients.forEach { (id, client) ->
          if (clients[id] !== client || !client.isOpen) { readyClients.remove(id, client); return@forEach }
          if (pendingBytes(client) >= 16384) { audioDropped.incrementAndGet(); return@forEach }
          try { client.send(packet.duplicate()); audioSent.incrementAndGet() }
          catch (_: Exception) { readyClients.remove(id, client); client.close() }
        }
      }
    }.also { it.name = "SyncoAudioNetwork"; it.start() }
  }

  private fun stopAudioWorker() {
    CaptureProbeService.frameSink = null; streaming = false; audioActive = false
    audioWorker?.interrupt(); audioWorker?.join(1000); audioWorker = null; audioQueue.clear(); readyClients.clear()
  }

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
        readyClients.remove(id, conn)
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
      startAudioWorker()
    } catch (error: Exception) { stopHost(); throw error }
  }

  @Synchronized private fun stopHost() {
    stopAudioWorker()
    val host = server ?: return
    server = null
    host.stop(1000)
    clients.clear()
    sendEvent("onStopped", emptyMap<String, Any>())
  }
}
