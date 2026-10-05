import { HostAdmission } from './host-admission';
import { decodeJoinCode, encodeJoinCode } from './index';
const token = '0123456789abcdef0123456789abcdef';
const hello = { type: 'HELLO', v: 1, token, deviceName: 'Guest', audioWire: 2 } as const;
test('rejects probes before admission and wrong-token joins', () => {
  const host = new HostAdmission(token, 'test', () => 123);
  expect(host.receive('a', { type: 'PING', v: 1, t0: 0 })).toBe('close');
  expect(host.receive('a', { ...hello, token: 'xxxxxxxxxxxxxxxx' })).toBe('close');
  expect(host.count).toBe(0);
});
test('accepts token, measures clock, and gates group starts on readiness', () => {
  const host = new HostAdmission(token, 'test', () => 123);
  expect(host.receive('a', hello)).toMatchObject({ type: 'WELCOME', sessionId: 'test' });
  expect(host.readyIds()).toEqual([]);
  expect(host.receive('a', { type: 'PING', v: 1, t0: 10 })).toEqual({ type: 'PONG', v: 1, t0: 10, t1: 123, t2: 123 });
  host.receive('a', { type: 'READY', v: 1, ready: true });
  expect(host.readyIds()).toEqual(['a']);
  host.receive('a', { type: 'READY', v: 1, ready: false });
  expect(host.readyIds()).toEqual([]);
  host.remove('a'); expect(host.count).toBe(0);
});
test('guests cannot control host playback or join twice', () => {
  const host = new HostAdmission(token, 'test', () => 123);
  host.receive('a', hello);
  expect(host.receive('a', { type: 'PLAY_AT', v: 1, hostTime: 1000, positionMs: 0 })).toBe('close');
  expect(host.receive('a', { type: 'AUDIO_STOP', v: 1 })).toBe('close');
  expect(host.receive('a', hello)).toBe('close');
});
test('join codes round-trip; public endpoints and incompatible versions fail', () => {
  const payload = { ip: '192.168.1.38', port: 8788, token, protocolVersion: 1 } as const;
  expect(decodeJoinCode(encodeJoinCode(payload))).toEqual(payload);
  expect(() => decodeJoinCode(encodeJoinCode({ ...payload, ip: '8.8.8.8' }))).toThrow();
  expect(() => decodeJoinCode(encodeJoinCode(payload).replace('v=1', 'v=2'))).toThrow();
});
