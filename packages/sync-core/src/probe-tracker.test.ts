import { ProbeTracker } from './probe-tracker';
function reply(clock: ProbeTracker, t0: number) {
  clock.sent(t0);
  return clock.receive({ t0, t1: t0 + 110, t2: t0 + 110, t3: t0 + 20 });
}
test('only matched fresh replies contribute; duplicate replies are ignored', () => {
  const clock = new ProbeTracker();
  expect(clock.receive({ t0: 0, t1: 110, t2: 110, t3: 20 })).toBeUndefined();
  reply(clock, 0);
  expect(clock.receive({ t0: 0, t1: 110, t2: 110, t3: 20 })).toBeUndefined();
  expect(clock.get(30)).toBeUndefined();
});
test('three replies allow scheduling; silence invalidates clock', () => {
  const clock = new ProbeTracker();
  [0, 200, 400].forEach(t => reply(clock, t));
  expect(clock.get(500)?.offsetMs).toBe(100);
  expect(clock.get(16000)).toBeUndefined();
  reply(clock, 17000);
  expect(clock.get(17020)).toBeUndefined();
});
test('late replies and reconnect state cannot schedule playback', () => {
  const clock = new ProbeTracker();
  clock.sent(0);
  expect(clock.receive({ t0: 0, t1: 110, t2: 110, t3: 3000 })).toBeUndefined();
  [4000, 4200, 4400].forEach(t => reply(clock, t));
  clock.reset();
  expect(clock.get(4500)).toBeUndefined();
});
