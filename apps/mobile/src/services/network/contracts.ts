import type { Message } from '@synco/protocol';
export interface Transport {
  connect(endpoint: string): Promise<void>;
  send(message: Message): Promise<void>;
  /** Validate wire data before invoking listeners. Returns unsubscribe. */
  onMessage(listener: (message: Message) => void): () => void;
  onDisconnect(listener: (reason: string) => void): () => void;
  close(): Promise<void>;
}
