import { guestPlayTime } from '@synco/sync-core';
import { ProbeTracker } from '@synco/sync-core/src/probe-tracker';
import { WebSocketTransport } from '../network/websocket-transport';
import { ClickEngine } from '../audio/click-engine';

export type SpikeSnapshot = {
  connected: boolean; ready: boolean; rttMs: number | null; offsetMs: number | null;
  audio: string; error: string | null;
};
export class SpikeSession {
  private audio = new ClickEngine();
  private transport = new WebSocketTransport();
  private clock = new ProbeTracker();
  private timer?: ReturnType<typeof setTimeout>;
  private active = true;
  private sent = 0;
  private audioGeneration = 0;
  constructor(private update: (patch: Partial<SpikeSnapshot>) => void) {}
  async localClick(): Promise<void> {
    const generation = ++this.audioGeneration;
    await this.audio.prepare();
    if (this.active && generation === this.audioGeneration) this.schedule(performance.now() + 2000);
  }
  private schedule(localTime: number): void {
    this.audioGeneration++;
    const result = this.audio.schedule(localTime, () => this.update({ audio: 'Finished 8 clicks' }));
    this.update({ audio: `Scheduled 8 clicks; lead ${Math.round(result.leadMs)} ms`, error: null });
  }
  async connect(): Promise<void> {
    await this.audio.prepare();
    if (!this.active) return;
    this.transport.onDisconnect(reason => {
      clearTimeout(this.timer); this.clock.reset(); this.audio.stop();
      this.update({ connected: false, ready: false, rttMs: null, offsetMs: null, audio: 'Stopped', error: reason });
    });
    this.transport.onMessage(message => {
      const now = performance.now();
      if (message.type === 'PONG') {
        this.clock.receive({ ...message, t3: now });
        const estimate = this.clock.get(now);
        this.update({ ready: !!estimate, rttMs: estimate?.rttMs ?? null, offsetMs: estimate?.offsetMs ?? null });
      } else if (message.type === 'PLAY_AT') {
        const estimate = this.clock.get(now);
        if (!estimate || message.positionMs !== 0) {
          this.update({ error: 'Start rejected: clock not ready or unsupported position' }); return;
        }
        try { this.schedule(guestPlayTime(message.hostTime, estimate.offsetMs)); }
        catch (error) { this.update({ error: error instanceof Error ? error.message : 'Scheduling failed' }); }
      } else if (message.type === 'BYE') { void this.dispose(); this.update({ connected: false, ready: false, audio: 'Stopped' }); }
    });
    await this.transport.connect('ws://127.0.0.1:8787');
    if (!this.active) { await this.transport.close(); return; }
    this.update({ connected: true, error: null });
    this.probe();
  }
  private probe(): void {
    if (!this.active) return;
    const t0 = performance.now();
    this.clock.sent(t0);
    const estimate = this.clock.get(t0);
    this.update({ ready: !!estimate, rttMs: estimate?.rttMs ?? null, offsetMs: estimate?.offsetMs ?? null });
    void this.transport.send({ type: 'PING', v: 1, t0 }).catch(error => this.update({ error: String(error) }));
    this.sent++;
    this.timer = setTimeout(() => this.probe(), this.sent < 10 ? 200 : 5000);
  }
  stopAudio(): void { this.audioGeneration++; this.audio.stop(); this.update({ audio: 'Stopped' }); }
  async dispose(): Promise<void> {
    this.active = false; this.audioGeneration++; clearTimeout(this.timer); this.clock.reset();
    await this.transport.close(); await this.audio.dispose();
  }
}
