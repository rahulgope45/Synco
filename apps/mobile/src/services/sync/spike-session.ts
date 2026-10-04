import { decodeJoinCode, messageSchema } from '@synco/protocol';
import { captureProbe } from '../audio/capture-probe';
import { PhoneHost } from '../network/phone-host';
import { getHostModule } from '../../../modules/synco-host';
import { guestPlayTime } from '@synco/sync-core';
import { ProbeTracker } from '@synco/sync-core/src/probe-tracker';
import { WebSocketTransport } from '../network/websocket-transport';
import { ClickEngine } from '../audio/click-engine';

export type SpikeSnapshot = {
  connected: boolean; ready: boolean; rttMs: number | null; offsetMs: number | null;
  audio: string; error: string | null;
  role: 'none' | 'host' | 'guest' | 'simulator'; joinCode: string | null; guests: number; readyGuests: number;
};
export class SpikeSession {
  private audio = new ClickEngine();
  private transport = new WebSocketTransport();
  private clock = new ProbeTracker();
  private timer?: ReturnType<typeof setTimeout>;
  private active = true;
  private sent = 0;
  private audioGeneration = 0;
  private host?: PhoneHost;
  private phoneGuest = false;
  private wasReady = false;
  private captureSubscriptions: { remove(): void }[] = [];
  private receivingLive = false;
  private lastLiveSeq = -1;
  private missingLiveFrames = 0;
  startMusicSharing(): void {
    if (!this.host) throw new Error('Create a phone session first');
    if (this.captureSubscriptions.length) throw new Error('Music sharing already started');
    this.audio.stop();
    this.captureSubscriptions = [captureProbe.frames(frame => {
      if (!this.active) return;
      const message = messageSchema.safeParse({ type: 'AUDIO_PCM', v: 1, ...frame });
      if (!message.success || message.data.type !== 'AUDIO_PCM') return;
      this.host?.broadcastLive(message.data);
    }), captureProbe.ended(() => {
      void this.host?.broadcast({ type: 'AUDIO_STOP', v: 1 }).catch(() => {});
      this.captureSubscriptions.forEach(subscription => subscription.remove()); this.captureSubscriptions = [];
      this.update({ audio: 'Music sharing stopped' });
    })];
    try { captureProbe.start(true); this.update({ audio: 'Sharing app audio — experimental, delayed playback' }); }
    catch (error) { this.captureSubscriptions.forEach(subscription => subscription.remove()); this.captureSubscriptions = []; throw error; }
  }
  static addresses(): string[] { return getHostModule().addresses(); }
  async hostSession(ip: string): Promise<void> {
    await this.audio.prepare();
    if (!this.active) return;
    const host = new PhoneHost(
      (guests, readyGuests) => this.update({ guests, readyGuests }),
      reason => { this.update({ role: 'none', joinCode: null, guests: 0, readyGuests: 0, error: reason, audio: 'Stopped' }); },
    );
    this.host = host;
    const joinCode = await host.start(ip);
    if (!this.active) { await host.stop(); return; }
    this.update({ role: 'host', joinCode, error: null });
  }
  async groupClick(): Promise<void> {
    if (!this.host) throw new Error('Create a phone session first');
    const hostTime = performance.now() + 3000;
    await this.host.broadcast({ type: 'PLAY_AT', v: 1, hostTime, positionMs: 0 });
    if (this.active) this.schedule(hostTime);
  }
  private publishClock(now: number): void {
    const estimate = this.clock.get(now);
    const ready = !!estimate;
    this.update({ ready, rttMs: estimate?.rttMs ?? null, offsetMs: estimate?.offsetMs ?? null });
    if (this.phoneGuest && ready !== this.wasReady) {
      this.wasReady = ready;
      void this.transport.send({ type: 'READY', v: 1, ready }).catch(() => this.update({ error: 'Could not update host readiness' }));
    }
  }
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
  async connect(joinCode?: string): Promise<void> {
    const payload = joinCode ? decodeJoinCode(joinCode) : undefined;
    this.phoneGuest = !!payload;
    let welcomeResolve: (() => void) | undefined;
    let welcomeReject: ((error: Error) => void) | undefined;
    let admitted = !payload;
    let welcomeTimer: ReturnType<typeof setTimeout> | undefined;
    const welcome = payload ? new Promise<void>((resolve, reject) => { welcomeResolve = resolve; welcomeReject = reject; }) : Promise.resolve();
    // Observe rejection immediately; the await occurs after socket startup.
    void welcome.catch(() => {});
    await this.audio.prepare();
    if (!this.active) return;
    this.transport.onDisconnect(reason => {
      clearTimeout(this.timer); clearTimeout(welcomeTimer); welcomeReject?.(new Error(reason)); this.clock.reset(); this.audio.stop();
      this.update({ connected: false, ready: false, rttMs: null, offsetMs: null, audio: 'Stopped', error: reason, role: 'none' });
    });
    this.transport.onMessage(message => {
      const now = performance.now();
      if (message.type === 'WELCOME' && payload && !admitted) {
        if (message.trackMeta.title !== 'Synco click track' || message.trackMeta.durationMs !== 8000) {
          welcomeReject?.(new Error('Host is using a different test track')); return;
        }
        admitted = true; clearTimeout(welcomeTimer); welcomeResolve?.(); return;
      }
      if (!admitted) { welcomeReject?.(new Error('Host did not accept this join code')); return; }
      if (message.type === 'PONG') {
        this.clock.receive({ ...message, t3: now });
        this.publishClock(now);
      } else if (message.type === 'AUDIO_PCM' && this.phoneGuest) {
        try {
          if (!this.receivingLive) { this.audio.stop(); this.receivingLive = true; }
          if (this.lastLiveSeq >= 0 && message.seq > this.lastLiveSeq) this.missingLiveFrames += message.seq - this.lastLiveSeq - 1;
          this.lastLiveSeq = message.seq;
          captureProbe.play(message.pcm);
          if (message.seq % 250 === 0) this.update({ audio: `Live music: frame ${message.seq}, ${this.missingLiveFrames} missing. Playback is delayed.` });
        } catch { this.update({ error: 'Live audio needs the updated Android build' }); }
      } else if (message.type === 'AUDIO_STOP') {
        captureProbe.stopPlayback(); this.receivingLive = false; this.lastLiveSeq = -1; this.missingLiveFrames = 0; this.update({ audio: 'Music sharing stopped' });
      } else if (message.type === 'PLAY_AT') {
        captureProbe.stopPlayback(); this.receivingLive = false;
        const estimate = this.clock.get(now);
        if (!estimate || message.positionMs !== 0) {
          this.update({ error: 'Start rejected: clock not ready or unsupported position' }); return;
        }
        try { this.schedule(guestPlayTime(message.hostTime, estimate.offsetMs)); }
        catch (error) { this.update({ error: error instanceof Error ? error.message : 'Scheduling failed' }); }
      } else if (message.type === 'BYE') { this.update({ connected: false, ready: false, audio: 'Stopped', role: 'none' }); }
    });
    await this.transport.connect(payload ? `ws://${payload.ip}:${payload.port}` : 'ws://127.0.0.1:8787');
    if (payload) {
      welcomeTimer = setTimeout(() => welcomeReject?.(new Error('Host admission timed out')), 5000);
      try {
        await this.transport.send({ type: 'HELLO', v: 1, token: payload.token, deviceName: 'Synco guest' });
        await welcome;
      } finally { clearTimeout(welcomeTimer); }
    }
    if (!this.active) { await this.transport.close(); return; }
    this.update({ connected: true, error: null, role: payload ? 'guest' : 'simulator' });
    this.probe();
  }
  private probe(): void {
    if (!this.active) return;
    const t0 = performance.now();
    this.clock.sent(t0);
    this.publishClock(t0);
    void this.transport.send({ type: 'PING', v: 1, t0 }).catch(error => this.update({ error: String(error) }));
    this.sent++;
    this.timer = setTimeout(() => this.probe(), this.sent < 10 ? 200 : 5000);
  }
  stopAudio(): void { this.audioGeneration++; this.audio.stop(); if (this.receivingLive) captureProbe.stopPlayback(); this.receivingLive = false; this.update({ audio: 'Stopped' }); }
  async dispose(): Promise<void> {
    this.active = false; this.audioGeneration++; clearTimeout(this.timer); this.clock.reset();
    if (this.captureSubscriptions.length) captureProbe.stop();
    this.captureSubscriptions.forEach(subscription => subscription.remove()); this.captureSubscriptions = [];
    if (this.receivingLive) captureProbe.stopPlayback(); this.receivingLive = false;
    await this.transport.close(); await this.host?.stop(); this.host = undefined; await this.audio.dispose();
  }
}
