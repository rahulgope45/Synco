import type { Message } from './index';
export class HostAdmission {
  private guests = new Map<string, { name: string; ready: boolean }>();
  private token: string;
  private sessionId: string;
  private now: () => number;
  constructor(token: string, sessionId: string, now: () => number) {
    this.token = token; this.sessionId = sessionId; this.now = now;
  }
  receive(id: string, message: Message): Message | 'close' | undefined {
    if (message.type === 'HELLO') {
      if (this.guests.has(id) || this.guests.size >= 8 || message.token !== this.token) return 'close';
      this.guests.set(id, { name: message.deviceName, ready: false });
      return { type: 'WELCOME', v: 1, sessionId: this.sessionId, hostTime: this.now(), trackMeta: { title: 'Synco click track', durationMs: 8000 } };
    }
    if (!this.guests.has(id)) return 'close';
    if (message.type === 'PING') {
      const t1 = this.now();
      return { type: 'PONG', v: 1, t0: message.t0, t1, t2: this.now() };
    }
    if (message.type === 'READY') { this.guests.get(id)!.ready = message.ready; return; }
    return 'close'; // Guests cannot send playback commands, including PAUSE.
  }
  remove(id: string): void { this.guests.delete(id); }
  readyIds(): string[] { return [...this.guests].filter(([, guest]) => guest.ready).map(([id]) => id); }
  get count(): number { return this.guests.size; }
  has(id: string): boolean { return this.guests.has(id); }
}
