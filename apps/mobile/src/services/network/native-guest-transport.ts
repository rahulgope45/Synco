import { requireNativeModule } from 'expo';
import { decodeMessage, type Message } from '@synco/protocol';
import type { Transport } from './contracts';

type Metrics = { received: number; missing: number; discarded: number; queued: number; overflowDrops: number; outputUnderruns: number; writtenFrames: number };
type GuestModule = {
  connect(endpoint: string): Promise<void>;
  send(text: string): Promise<void>;
  close(): Promise<void>;
  setAdmitted(value: boolean): void;
  stopPlayback(): void;
  audioMetrics(): Metrics;
  addListener(event: 'onMessage', listener: (event: { text: string }) => void): { remove(): void };
  addListener(event: 'onClose', listener: (event: { reason: string }) => void): { remove(): void };
  addListener(event: 'onAudio', listener: (event: Metrics) => void): { remove(): void };
  addListener(event: 'onOutputError', listener: (event: { message: string }) => void): { remove(): void };
};

export class NativeGuestTransport implements Transport {
  private module = requireNativeModule<GuestModule>('SyncoGuest');
  private subscriptions: { remove(): void }[] = [];
  private messages = new Set<(message: Message) => void>();
  private disconnects = new Set<(reason: string) => void>();
  private audio = new Set<(metrics: Metrics) => void>();

  async connect(endpoint: string): Promise<void> {
    this.subscriptions = [
      this.module.addListener('onMessage', ({ text }) => {
        try { const message = decodeMessage(text); this.messages.forEach(listener => listener(message)); }
        catch { this.disconnects.forEach(listener => listener('Invalid host control message')); void this.close(); }
      }),
      this.module.addListener('onClose', ({ reason }) => this.disconnects.forEach(listener => listener(reason))),
      this.module.addListener('onAudio', metrics => this.audio.forEach(listener => listener(metrics))),
      this.module.addListener('onOutputError', ({ message }) => this.disconnects.forEach(listener => listener(message))),
    ];
    try { await this.module.connect(endpoint); }
    catch (error) { this.subscriptions.forEach(s => s.remove()); this.subscriptions = []; throw error; }
  }
  async send(message: Message): Promise<void> { await this.module.send(JSON.stringify(message)); }
  onMessage(listener: (message: Message) => void): () => void { this.messages.add(listener); return () => { this.messages.delete(listener); }; }
  onDisconnect(listener: (reason: string) => void): () => void { this.disconnects.add(listener); return () => { this.disconnects.delete(listener); }; }
  onAudio(listener: (metrics: Metrics) => void): () => void { this.audio.add(listener); return () => { this.audio.delete(listener); }; }
  admitAudio(): void { this.module.setAdmitted(true); }
  stopAudio(): void { this.module.stopPlayback(); }
  metrics(): Metrics { return this.module.audioMetrics(); }
  async close(): Promise<void> {
    this.subscriptions.forEach(s => s.remove()); this.subscriptions = [];
    this.messages.clear(); this.disconnects.clear(); this.audio.clear();
    await this.module.close();
  }
}
