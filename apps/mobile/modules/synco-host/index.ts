import { requireNativeModule } from 'expo';
type Events = {
  onOpen: (event: { id: string }) => void;
  onMessage: (event: { id: string; text: string }) => void;
  onClose: (event: { id: string }) => void;
  onHostError: (event: { message: string }) => void;
  onStopped: () => void;
};
type HostModule = {
  addListener<K extends keyof Events>(event: K, listener: Events[K]): { remove(): void };
  addresses(): string[];
  sessionToken(): string;
  start(ip: string, port: number): Promise<void>;
  send(id: string, text: string): Promise<void>;
  setAudioReady(id: string, ready: boolean): void;
  beginAudioStream(): void;
  endAudioStream(): void;
  audioMetrics(): { sent: number; dropped: number; queued: number };
  closeClient(id: string): Promise<void>;
  stop(): Promise<void>;
};
// Lazy loading lets unsupported platforms display a useful error when hosting is selected.
export const getHostModule = () => requireNativeModule<HostModule>('SyncoHost');
