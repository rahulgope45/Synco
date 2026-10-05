import { AUDIO_WIRE, decodeAudioPacket, encodeAudioPacket } from './audio-wire';

test('binary PCM frame round trips with fixed little-endian header', () => {
  expect(AUDIO_WIRE.version).toBe(2); // HELLO/WELCOME capability value
  const pcm = Uint8Array.from({ length: AUDIO_WIRE.pcmBytes }, (_, i) => i % 256);
  const encoded = encodeAudioPacket({ epoch: 0x10203040, sequence: 7, samplePosition: 6720, pcm });
  expect(encoded.byteLength).toBe(1952);
  expect([...encoded.slice(8, 12)]).toEqual([0x40, 0x30, 0x20, 0x10]);
  expect(decodeAudioPacket(encoded)).toEqual({ epoch: 0x10203040, sequence: 7, samplePosition: 6720, pcm });
});

test('rejects malformed or unsupported audio packets', () => {
  const packet = encodeAudioPacket({ epoch: 1, sequence: 0, samplePosition: 0, pcm: new Uint8Array(1920) });
  expect(() => decodeAudioPacket(packet.subarray(0, 31))).toThrow();
  expect(() => decodeAudioPacket(new Uint8Array(1953))).toThrow();
  for (const offset of [0, 4, 5, 6, 7, 20, 24, 26, 28]) {
    const bad = packet.slice(); bad[offset] = bad[offset]! ^ 0xff;
    expect(() => decodeAudioPacket(bad)).toThrow();
  }
  expect(() => encodeAudioPacket({ epoch: 1, sequence: -1, samplePosition: 0, pcm: new Uint8Array(1920) })).toThrow();
});
