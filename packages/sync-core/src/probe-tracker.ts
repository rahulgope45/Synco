import { OffsetEstimator, type Estimate } from './index';

/** Correlate replies and expire the estimate when replies stop arriving. */
export class ProbeTracker {
  private pending = new Set<number>();
  private estimator = new OffsetEstimator();
  private lastReplyMs = -Infinity;
  private accepted = 0;
  sent(t0: number): void {
    for (const time of this.pending) if (t0 - time > 2000) this.pending.delete(time);
    this.pending.add(t0);
  }
  receive(probe: { t0: number; t1: number; t2: number; t3: number }): Estimate | undefined {
    if (!this.pending.delete(probe.t0) || probe.t3 - probe.t0 > 2000) return undefined;
    if (probe.t3 - this.lastReplyMs > 15000) { this.estimator.reset(); this.accepted = 0; }
    const estimate = this.estimator.add(probe);
    this.lastReplyMs = probe.t3;
    this.accepted++;
    return estimate;
  }
  get(nowMs: number): Estimate | undefined {
    return this.accepted >= 3 && nowMs - this.lastReplyMs <= 15000 ? this.estimator.best() : undefined;
  }
  reset(): void {
    this.pending.clear(); this.estimator.reset(); this.lastReplyMs = -Infinity; this.accepted = 0;
  }
}
