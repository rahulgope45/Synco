package expo.modules.syncohost

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.java_websocket.client.WebSocketClient
import org.java_websocket.drafts.Draft_6455
import org.java_websocket.handshake.ServerHandshake
import java.net.URI
import java.nio.ByteBuffer
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/** One native socket owns both text controls and binary audio. JS never receives PCM. */
class SyncoGuestModule : Module() {
  @Volatile private var socket: WebSocketClient? = null
  private val player = LivePcmPlayer { sendEvent("onOutputError", mapOf("message" to it)) }
  @Volatile private var admitted = false
  @Volatile private var epoch: Long? = null
  @Volatile private var blockedEpoch: Long? = null
  @Volatile private var lastSequence: Long? = null
  @Volatile private var lastSamplePosition: Long? = null
  private val received = AtomicInteger()
  private val missing = AtomicInteger()
  private val discarded = AtomicInteger()

  override fun definition() = ModuleDefinition {
    Name("SyncoGuest")
    Events("onMessage", "onClose", "onAudio", "onOutputError")
    AsyncFunction("connect") { endpoint: String -> open(endpoint) }
    AsyncFunction("send") { text: String ->
      require(text.toByteArray(Charsets.UTF_8).size <= 4096)
      val current = socket ?: error("Guest disconnected")
      check(current.isOpen) { "Guest disconnected" }
      current.send(text)
    }
    Function("setAdmitted") { value: Boolean -> admitted = value }
    Function("audioMetrics") { metrics() }
    Function("stopPlayback") { player.stop(); blockedEpoch = epoch; epoch = null; lastSequence = null; lastSamplePosition = null }
    AsyncFunction("close") { closeGuest() }
    OnActivityEntersBackground { if (socket != null) { closeGuest(); sendEvent("onClose", mapOf("reason" to "Listener stopped in background")) } }
    OnDestroy { closeGuest() }
  }

  @Synchronized private fun open(endpoint: String) {
    check(socket == null) { "Guest already connected" }
    val uri = URI(endpoint)
    require(uri.scheme == "ws" && uri.host != null && uri.port in 1024..65535) { "Invalid local guest endpoint" }
    admitted = false; epoch = null; blockedEpoch = null; lastSequence = null; lastSamplePosition = null
    received.set(0); missing.set(0); discarded.set(0)
    val client = object : WebSocketClient(uri, Draft_6455(emptyList(), 4096)) {
      override fun onOpen(handshake: ServerHandshake) {}
      override fun onMessage(message: String) {
        if (message.toByteArray(Charsets.UTF_8).size > 4096) { close(1008, "Control limit exceeded"); return }
        if (this@SyncoGuestModule.socket === this) sendEvent("onMessage", mapOf("text" to message))
      }
      override fun onMessage(message: ByteBuffer) {
        if (this@SyncoGuestModule.socket !== this) return
        if (!admitted) { discarded.incrementAndGet(); return }
        val frame = AudioWire.decode(message)
        if (frame == null) { discarded.incrementAndGet(); close(1008, "Invalid audio packet"); return }
        if (frame.epoch == blockedEpoch) { discarded.incrementAndGet(); return }
        if (epoch != frame.epoch) { player.stop(); epoch = frame.epoch; lastSequence = null; lastSamplePosition = null }
        val previous = lastSequence
        if (previous != null) {
          val sequenceDelta = (frame.sequence - previous) and 0xffffffffL
          val sampleDelta = (frame.samplePosition - lastSamplePosition!!) and 0xffffffffL
          if (sequenceDelta == 0L || sequenceDelta > 0x7fffffffL || sampleDelta == 0L || sampleDelta > 0x7fffffffL) {
            discarded.incrementAndGet(); return
          }
          missing.addAndGet((sequenceDelta - 1).coerceAtMost(Int.MAX_VALUE.toLong()).toInt())
        }
        lastSequence = frame.sequence
        lastSamplePosition = frame.samplePosition
        player.offer(frame.pcm)
        if (received.incrementAndGet() % 250 == 0) sendEvent("onAudio", metrics())
      }
      override fun onClose(code: Int, reason: String, remote: Boolean) {
        if (this@SyncoGuestModule.socket === this) { admitted = false; player.stop(); this@SyncoGuestModule.socket = null; sendEvent("onClose", mapOf("reason" to "Phone host disconnected")) }
      }
      override fun onError(error: Exception) {
        if (this@SyncoGuestModule.socket === this) sendEvent("onClose", mapOf("reason" to "Guest connection failed"))
      }
    }
    socket = client
    try { check(client.connectBlocking(5, TimeUnit.SECONDS)) { "Cannot reach phone host" } }
    catch (error: Exception) { socket = null; client.close(); throw error }
  }

  private fun metrics(): Map<String, Int> = player.metrics() + mapOf("received" to received.get(),
    "missing" to missing.get(), "discarded" to discarded.get())

  @Synchronized private fun closeGuest() {
    val current = socket
    socket = null; admitted = false; epoch = null; blockedEpoch = null; lastSequence = null; lastSamplePosition = null
    player.stop(); current?.close()
  }
}
