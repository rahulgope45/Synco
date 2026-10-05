import { decodeMessage, joinPayloadSchema } from './index';
test('valid phase-0 probe decodes', () => {
  expect(decodeMessage('{"type":"PING","v":1,"t0":5}')).toEqual({ type: 'PING', v: 1, t0: 5 });
});
test.each(['{"type":"PING","v":2,"t0":5}', '{"type":"PING","v":1,"t0":-1}', '{"type":"PING","v":1,"t0":5,"extra":true}', 'bad json'])('rejects malformed or incompatible wire data: %s', data => {
  expect(() => decodeMessage(data)).toThrow();
});
test('rejects invalid QR network coordinates', () => {
  expect(joinPayloadSchema.safeParse({ ip: 'not-an-ip', port: 70000, token: 'short', protocolVersion: 1 }).success).toBe(false);
});
test('legacy base64 PCM control is rejected', () => {
  const frame = { type: 'AUDIO_PCM', v: 1, seq: 0, pcm: 'A'.repeat(2560) };
  expect(() => decodeMessage(JSON.stringify(frame))).toThrow();
});

test('old phone guests without the binary capability are rejected', () => {
  const hello = { type: 'HELLO', v: 1, token: '0123456789abcdef', deviceName: 'Old guest' };
  expect(() => decodeMessage(JSON.stringify(hello))).toThrow();
  expect(decodeMessage(JSON.stringify({ ...hello, audioWire: 2 }))).toMatchObject({ audioWire: 2 });
});
