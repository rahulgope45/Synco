import { estimateProbe, guestPlayTime, OffsetEstimator } from './index';
test('symmetric network delay recovers the host offset', () => {
  expect(estimateProbe({ t0: 0, t1: 110, t2: 112, t3: 22 })).toEqual({ offsetMs: 100, rttMs: 20 });
});
test('asymmetric delay leaves measurable estimation bias', () => {
  expect(estimateProbe({ t0: 0, t1: 105, t2: 105, t3: 30 }).offsetMs).toBe(90);
});
test('jitter is rejected until low RTT sample leaves the rolling window', () => {
  const clock = new OffsetEstimator(2);
  clock.add({ t0: 0, t1: 110, t2: 110, t3: 20 });
  expect(clock.add({ t0: 0, t1: 180, t2: 180, t3: 100 }).offsetMs).toBe(100);
  expect(clock.add({ t0: 0, t1: 120, t2: 120, t3: 30 }).offsetMs).toBe(105);
});
test('missing replies do not create samples; reconnect clears stale offset', () => {
  const clock = new OffsetEstimator();
  expect(clock.best()).toBeUndefined();
  clock.add({ t0: 0, t1: 110, t2: 110, t3: 20 });
  expect(clock.best()?.offsetMs).toBe(100);
  clock.reset();
  expect(clock.best()).toBeUndefined();
});
test('clock conversion preserves negative manual compensation', () => {
  expect(guestPlayTime(1000, 100, -50)).toBe(850);
});
test('invalid probes and compensation fail explicitly', () => {
  expect(() => estimateProbe({ t0: 0, t1: 0, t2: 30, t3: 20 })).toThrow();
  expect(() => guestPlayTime(0, 0, 201)).toThrow();
});
