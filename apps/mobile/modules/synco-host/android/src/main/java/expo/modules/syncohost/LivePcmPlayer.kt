package expo.modules.syncohost

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.util.Base64
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit

/** Bounded experimental receiver. Wire contract is AUDIO_PCM in packages/protocol. */
class LivePcmPlayer {
  private val queue = ArrayBlockingQueue<ByteArray>(15)
  @Volatile private var active = false
  private var worker: Thread? = null
  private var track: AudioTrack? = null
  @Synchronized fun offer(pcm: String) {
    require(pcm.length == 2560) { "Invalid PCM frame" }
    val bytes = Base64.decode(pcm, Base64.NO_WRAP)
    require(bytes.size == 1920) { "Invalid PCM frame size" }
    if (!active) start()
    if (!queue.offer(bytes)) { queue.clear(); queue.offer(bytes) }
  }
  private fun start() {
    active = true
    worker = Thread {
      var audio: AudioTrack? = null
      try {
        val min = AudioTrack.getMinBufferSize(48000, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
        check(min > 0)
        audio = AudioTrack.Builder().setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
          .setAudioFormat(AudioFormat.Builder().setSampleRate(48000).setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT).build())
          .setBufferSizeInBytes(maxOf(min, 9600)).setTransferMode(AudioTrack.MODE_STREAM).build()
        track = audio
        check(audio.state == AudioTrack.STATE_INITIALIZED)
        // Small startup cushion; receiver playback is not synchronized with source output.
        while (active && queue.size < 5) Thread.sleep(10)
        if (active) audio.play()
        while (active) {
          val bytes = queue.poll(500, TimeUnit.MILLISECONDS) ?: continue
          var offset = 0
          while (active && offset < bytes.size) {
            val written = audio.write(bytes, offset, bytes.size - offset, AudioTrack.WRITE_BLOCKING)
            check(written > 0) { "Audio output failed" }
            offset += written
          }
        }
      } catch (_: InterruptedException) {
        // Expected during stop.
      } catch (_: Exception) {
        // Stop this receiver; the next explicit session can retry.
      } finally {
        active = false
        try { audio?.stop() } catch (_: Exception) {}
        audio?.release(); track = null; queue.clear()
      }
    }.also { it.name = "SyncoLivePlayback"; it.start() }
  }
  @Synchronized fun stop() {
    active = false
    try { track?.pause(); track?.flush() } catch (_: Exception) {}
    worker?.interrupt(); worker?.join(1000); worker = null; queue.clear()
  }
}
