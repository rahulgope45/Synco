import spec from './audio-wire.json';

export const AUDIO_WIRE = spec;
export type AudioPacket = { epoch: number; sequence: number; samplePosition: number; pcm: Uint8Array };

/** Fixed 20 ms, 48 kHz mono PCM16LE packet. All integers are unsigned LE. */
export function encodeAudioPacket(packet: AudioPacket): Uint8Array {
  if (packet.pcm.byteLength !== spec.pcmBytes) throw new Error('Invalid PCM length');
  for (const value of [packet.epoch, packet.sequence, packet.samplePosition]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) throw new Error('Invalid audio counter');
  }
  const bytes = new Uint8Array(spec.maxPacketBytes);
  const header = new DataView(bytes.buffer);
  header.setUint32(0, spec.magic, true);
  header.setUint8(4, spec.version);
  header.setUint8(5, spec.headerBytes);
  header.setUint8(6, spec.encoding);
  header.setUint8(7, spec.channels);
  header.setUint32(8, packet.epoch, true);
  header.setUint32(12, packet.sequence, true);
  header.setUint32(16, packet.samplePosition, true);
  header.setUint32(20, spec.sampleRate, true);
  header.setUint16(24, spec.samplesPerFrame, true);
  header.setUint16(26, spec.pcmBytes, true);
  header.setUint32(28, 0, true);
  bytes.set(packet.pcm, spec.headerBytes);
  return bytes;
}

export function decodeAudioPacket(bytes: Uint8Array): AudioPacket {
  if (bytes.byteLength !== spec.maxPacketBytes) throw new Error('Invalid packet length');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== spec.magic || view.getUint8(4) !== spec.version ||
      view.getUint8(5) !== spec.headerBytes || view.getUint8(6) !== spec.encoding ||
      view.getUint8(7) !== spec.channels || view.getUint32(20, true) !== spec.sampleRate ||
      view.getUint16(24, true) !== spec.samplesPerFrame || view.getUint16(26, true) !== spec.pcmBytes ||
      view.getUint32(28, true) !== 0) throw new Error('Unsupported audio packet');
  return {
    epoch: view.getUint32(8, true), sequence: view.getUint32(12, true),
    samplePosition: view.getUint32(16, true), pcm: bytes.subarray(spec.headerBytes),
  };
}
