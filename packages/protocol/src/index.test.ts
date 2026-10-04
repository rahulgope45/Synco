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
