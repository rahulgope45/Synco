// Generated from packages/protocol/src/audio-wire.json. Run npm run wire:generate.
package expo.modules.syncohost

import java.nio.ByteBuffer
import java.nio.ByteOrder

object AudioWire {
  const val MAGIC = 1398362965
  const val VERSION = 2
  const val HEADER_BYTES = 32
  const val SAMPLE_RATE = 48000
  const val CHANNELS = 1
  const val ENCODING = 1
  const val SAMPLES_PER_FRAME = 960
  const val PCM_BYTES = 1920
  const val MAX_PACKET_BYTES = 1952

  data class Frame(val epoch: Long, val sequence: Long, val samplePosition: Long, val pcm: ByteArray)

  fun encode(epoch: Long, sequence: Long, samplePosition: Long, pcm: ByteArray): ByteBuffer {
    require(pcm.size == PCM_BYTES && epoch in 0..0xffffffffL && sequence in 0..0xffffffffL && samplePosition in 0..0xffffffffL)
    return ByteBuffer.allocate(MAX_PACKET_BYTES).order(ByteOrder.LITTLE_ENDIAN).apply {
      putInt(MAGIC); put(VERSION.toByte()); put(HEADER_BYTES.toByte()); put(ENCODING.toByte()); put(CHANNELS.toByte())
      putInt(epoch.toInt()); putInt(sequence.toInt()); putInt(samplePosition.toInt()); putInt(SAMPLE_RATE)
      putShort(SAMPLES_PER_FRAME.toShort()); putShort(PCM_BYTES.toShort()); putInt(0); put(pcm); flip()
    }
  }

  fun decode(source: ByteBuffer): Frame? {
    if (source.remaining() != MAX_PACKET_BYTES) return null
    val value = source.slice().order(ByteOrder.LITTLE_ENDIAN)
    if (value.int != MAGIC || value.get().toInt() and 255 != VERSION || value.get().toInt() and 255 != HEADER_BYTES ||
      value.get().toInt() and 255 != ENCODING || value.get().toInt() and 255 != CHANNELS) return null
    val epoch = value.int.toLong() and 0xffffffffL
    val sequence = value.int.toLong() and 0xffffffffL
    val samplePosition = value.int.toLong() and 0xffffffffL
    if (value.int != SAMPLE_RATE || value.short.toInt() and 65535 != SAMPLES_PER_FRAME ||
      value.short.toInt() and 65535 != PCM_BYTES || value.int != 0) return null
    return Frame(epoch, sequence, samplePosition, ByteArray(PCM_BYTES).also(value::get))
  }
}
