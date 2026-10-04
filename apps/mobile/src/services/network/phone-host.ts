import { decodeMessage, encodeJoinCode, type Message } from '@synco/protocol';
import { HostAdmission } from '@synco/protocol/src/host-admission';
import { getHostModule } from '../../../modules/synco-host';

export class PhoneHost {
  private module = getHostModule();
  private admission?: HostAdmission;
  private subscriptions: { remove(): void }[] = [];
  private pending = new Map<string, ReturnType<typeof setTimeout>>();
  constructor(private update: (guests: number, readyGuests: number) => void, private onStopped: (reason: string) => void) {}
  async start(ip: string): Promise<string> {
    const token = this.module.sessionToken();
    this.admission = new HostAdmission(token, `spike-${Math.round(performance.now())}`, () => performance.now());
    this.subscriptions = [
      this.module.addListener('onOpen', ({ id }) => {
        this.pending.set(id, setTimeout(() => { this.pending.delete(id); void this.module.closeClient(id); }, 5000));
      }),
      this.module.addListener('onMessage', ({ id, text }) => { void this.receive(id, text); }),
      this.module.addListener('onClose', ({ id }) => {
        clearTimeout(this.pending.get(id)); this.pending.delete(id); this.admission?.remove(id); this.publish();
      }),
      this.module.addListener('onHostError', ({ message }) => this.onStopped(message)),
      this.module.addListener('onStopped', () => this.onStopped('Phone host stopped')),
    ];
    try { await this.module.start(ip, 8788); }
    catch (error) { await this.stop(); throw error; }
    return encodeJoinCode({ ip, port: 8788, token, protocolVersion: 1 });
  }
  private publish(): void { this.update(this.admission?.count ?? 0, this.admission?.readyIds().length ?? 0); }
  private async receive(id: string, raw: string): Promise<void> {
    try {
      const response = this.admission?.receive(id, decodeMessage(raw));
      if (response === 'close') { await this.module.closeClient(id); return; }
      if (this.admission?.has(id)) { clearTimeout(this.pending.get(id)); this.pending.delete(id); }
      if (response) await this.module.send(id, JSON.stringify(response));
      this.publish();
    } catch { await this.module.closeClient(id).catch(() => {}); }
  }
  async broadcast(message: Message): Promise<void> {
    const ready = this.admission?.readyIds() ?? [];
    if (!ready.length) throw new Error('Wait for at least one guest to finish clock sync');
    const sent = await Promise.allSettled(ready.map(id => this.module.send(id, JSON.stringify(message))));
    if (sent.every(result => result.status === 'rejected')) throw new Error('No guest received the command');
  }
  broadcastLive(message: Extract<Message, { type: 'AUDIO_PCM' }>): void {
    this.module.sendLive(this.admission?.readyIds() ?? [], JSON.stringify(message));
  }
  async stop(): Promise<void> {
    this.subscriptions.forEach(subscription => subscription.remove()); this.subscriptions = [];
    this.pending.forEach(timer => clearTimeout(timer)); this.pending.clear(); this.admission = undefined;
    await this.module.stop();
  }
}
