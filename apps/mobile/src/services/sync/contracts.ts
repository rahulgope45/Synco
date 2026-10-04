export interface MonotonicClock { nowMs(): number }
export type SyncMetrics = {
  rttMs: number | null; offsetMs: number | null;
  driftMs: number | null; bufferDepthMs: number | null;
};
