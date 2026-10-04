/** All times are monotonic milliseconds; offset = host clock minus guest clock. */
export type Probe = { t0: number; t1: number; t2: number; t3: number };
export type Estimate = { offsetMs: number; rttMs: number };
export function estimateProbe({ t0, t1, t2, t3 }: Probe): Estimate {
  if (![t0, t1, t2, t3].every(Number.isFinite) || t3 < t0 || t2 < t1) {
    throw new Error('Invalid clock probe');
  }
  const rttMs = (t3 - t0) - (t2 - t1);
  if (rttMs < 0) throw new Error('Negative network round-trip time');
  return { offsetMs: ((t1 - t0) + (t2 - t3)) / 2, rttMs };
}
export class OffsetEstimator {
  private samples: Estimate[] = [];
  constructor(private readonly capacity = 8) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Invalid window size');
  }
  add(probe: Probe): Estimate {
    const sample = estimateProbe(probe);
    this.samples.push(sample);
    if (this.samples.length > this.capacity) this.samples.shift();
    return this.best()!;
  }
  best(): Estimate | undefined {
    const best = this.samples.reduce<Estimate | undefined>((best, sample) =>
      !best || sample.rttMs <= best.rttMs ? sample : best, undefined);
    return best ? { ...best } : undefined;
  }
  reset(): void { this.samples = []; }
}
export function guestPlayTime(hostTimeMs: number, offsetMs: number, userDelayMs = 0): number {
  if (![hostTimeMs, offsetMs, userDelayMs].every(Number.isFinite) || Math.abs(userDelayMs) > 200) {
    throw new Error('Invalid playback timing');
  }
  return hostTimeMs - offsetMs + userDelayMs;
}
