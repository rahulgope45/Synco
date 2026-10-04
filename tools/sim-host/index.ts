import { createInterface } from 'node:readline';
import { WebSocketServer, WebSocket } from 'ws';
import { decodeMessage, type Message } from '../../packages/protocol/src/index.ts';

// Loopback only. adb reverse connects phones; this is NOT the phone-host LAN gate.
const server = new WebSocketServer({ host: '127.0.0.1', port: 8787, maxPayload: 4096 });
server.on('listening', () => console.log('Synco test host on loopback:8787. Enter = schedule 8 clicks in 3 seconds.'));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.on('connection', socket => {
  console.log('Guest connected');
  let windowStart = performance.now();
  let count = 0;
  socket.on('message', data => {
    const t1 = performance.now();
    if (t1 - windowStart >= 1000) { count = 0; windowStart = t1; }
    if (++count > 30) { socket.close(1008, 'Too many messages'); return; }
    try {
      const message = decodeMessage(data.toString());
      if (message.type === 'PING') {
        const response: Message = { type: 'PONG', v: 1, t0: message.t0, t1, t2: performance.now() };
        socket.send(JSON.stringify(response));
      } else if (message.type === 'BYE') socket.close();
      else socket.close(1008, 'Unsupported simulator message');
    } catch { socket.close(1008, 'Invalid message'); }
  });
  socket.on('error', error => console.error(error.message));
  socket.on('close', () => console.log('Guest disconnected'));
});
const input = createInterface({ input: process.stdin, output: process.stdout });
input.on('line', () => {
  const message: Message = { type: 'PLAY_AT', v: 1, hostTime: performance.now() + 3000, positionMs: 0 };
  let count = 0;
  for (const guest of server.clients) {
    if (guest.readyState === WebSocket.OPEN) { guest.send(JSON.stringify(message)); count++; }
  }
  console.log(`Scheduled ${count} guest(s). Acoustic alignment is not measured by this tool.`);
});
process.on('SIGINT', () => {
  for (const guest of server.clients) guest.close();
  server.close(); input.close();
});
