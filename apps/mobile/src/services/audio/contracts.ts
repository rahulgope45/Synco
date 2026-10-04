export interface AudioEngine {
  prepareLocalFile(uri: string): Promise<void>;
  /** Monotonic local ms mapped to native audio time; reject late starts. */
  scheduleStart(localTimeMs: number, positionMs: number): Promise<void>;
  schedulePause(localTimeMs: number): Promise<void>;
  getPositionMs(): Promise<number>;
  dispose(): Promise<void>;
}
