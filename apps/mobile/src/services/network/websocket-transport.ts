import { decodeMessage, type Message } from '@synco/protocol';
import type { Transport } from './contracts';

export class WebSocketTransport implements Transport {
  private socket?: WebSocket;
  private messages = new Set<(message: Message) => void>();
  private disconnects = new Set<(reason: string) => void>();
  connect(endpoint: string): Promise<void> {
    if (this.socket) return Promise.reject(new Error('Transport already started'));
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(endpoint);
      this.socket = socket;
      const timeout = setTimeout(() => { reject(new Error('Connection timed out')); socket.close(); }, 5000);
      socket.onopen = () => { clearTimeout(timeout); resolve(); };
      socket.onmessage = event => {
        try {
          if (typeof event.data !== 'string') throw new Error('Expected a control message');
          const message = decodeMessage(event.data);
          this.messages.forEach(listener => listener(message));
        } catch { socket.close(1008, 'Invalid control message'); }
      };
      socket.onerror = () => { clearTimeout(timeout); reject(new Error('Cannot reach test host')); socket.close(); };
      socket.onclose = () => {
        clearTimeout(timeout); this.socket = undefined;
        reject(new Error('Connection closed'));
        this.disconnects.forEach(listener => listener('Test host disconnected'));
      };
    });
  }
  async send(message: Message): Promise<void> {
    if (this.socket?.readyState !== WebSocket.OPEN) throw new Error('Not connected');
    this.socket.send(JSON.stringify(message));
  }
  onMessage(listener: (message: Message) => void): () => void {
    this.messages.add(listener); return () => { this.messages.delete(listener); };
  }
  onDisconnect(listener: (reason: string) => void): () => void {
    this.disconnects.add(listener); return () => { this.disconnects.delete(listener); };
  }
  async close(): Promise<void> {
    this.messages.clear(); this.disconnects.clear();
    this.socket?.close(); this.socket = undefined;
  }
}
