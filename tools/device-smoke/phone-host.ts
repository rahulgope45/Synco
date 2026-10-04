import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import WebSocket from 'ws';
import { decodeJoinCode, decodeMessage, type Message } from '../../packages/protocol/src/index.ts';

const serial = process.argv[2];
if (!serial) throw new Error('Usage: node --experimental-strip-types tools/device-smoke/phone-host.ts ADB_SERIAL');
const adb = (...args: string[]) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8' });
function dump(): string {
  adb('shell', 'uiautomator', 'dump', '/sdcard/synco-window.xml');
  return adb('shell', 'cat', '/sdcard/synco-window.xml');
}
// Read the visible session code in memory; never print or persist the token.
const code = dump().match(/text="(synco:\/\/join\?ip=[^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
if (!code) throw new Error('Create a phone session in Synco first');
const join = decodeJoinCode(code);
const endpoint = `ws://${join.ip}:${join.port}`;
const clients: WebSocket[] = [];
function open(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint, { handshakeTimeout: 5000 }); clients.push(socket);
    socket.once('open', () => resolve(socket)); socket.on('error', reject);
  });
}
function next(socket: WebSocket, type: Message['type']): Promise<Message> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error(`Timed out waiting for ${type}`)); }, 5000);
    const onClose = () => { cleanup(); reject(new Error(`Closed before ${type}`)); };
    const onMessage = (raw: WebSocket.RawData) => {
      try { const message = decodeMessage(raw.toString()); if (message.type === type) { cleanup(); resolve(message); } }
      catch (error) { cleanup(); reject(error); }
    };
    function cleanup() { clearTimeout(timer); socket.off('message', onMessage); socket.off('close', onClose); }
    socket.on('message', onMessage); socket.once('close', onClose);
  });
}
async function rejected(raw: string): Promise<void> {
  const socket = await open();
  const closed = new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Unauthorized peer was not closed')), 5000);
    socket.once('close', code => { clearTimeout(timer); resolve(code); });
  });
  socket.send(raw); assert.equal(await closed, 1008);
}
async function admitted(name: string): Promise<WebSocket> {
  const socket = await open(); const welcomed = next(socket, 'WELCOME');
  socket.send(JSON.stringify({ type: 'HELLO', v: 1, token: join.token, deviceName: name }));
  assert.equal((await welcomed).type, 'WELCOME');
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now(); const response = next(socket, 'PONG');
    socket.send(JSON.stringify({ type: 'PING', v: 1, t0 }));
    const pong = await response; assert.equal(pong.type, 'PONG');
    if (pong.type === 'PONG') { assert.equal(pong.t0, t0); assert.ok(pong.t2 >= pong.t1); }
  }
  socket.send(JSON.stringify({ type: 'READY', v: 1, ready: true }));
  return socket;
}
try {
  await rejected(JSON.stringify({ type: 'HELLO', v: 1, token: 'wrong-token-000000', deviceName: 'Denied' }));
  await rejected(JSON.stringify({ type: 'PING', v: 1, t0: 1 }));
  await rejected('invalid json');
  console.log('PASS: wrong token, unauthenticated probes and malformed data rejected');
  const first = await admitted('Smoke guest 1'); const second = await admitted('Smoke guest 2');
  const firstStart = next(first, 'PLAY_AT'); const secondStart = next(second, 'PLAY_AT');
  const xml = dump();
  assert.ok(xml.includes('2 joined / 2 clock-ready'));
  const button = xml.match(/<node[^>]*content-desc="Play together in 3 seconds"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert.ok(button, 'Group play button must be visible');
  adb('shell', 'input', 'tap', String(Math.round((Number(button[1]) + Number(button[3])) / 2)), String(Math.round((Number(button[2]) + Number(button[4])) / 2)));
  const [a, b] = await Promise.all([firstStart, secondStart]); assert.deepEqual(a, b);
  console.log('PASS: two admitted Wi-Fi guests received the identical scheduled PLAY_AT');
  first.close();
  const pong = next(second, 'PONG'); second.send(JSON.stringify({ type: 'PING', v: 1, t0: 99 })); await pong;
  console.log('PASS: one guest leaving did not interrupt the other');
} finally {
  clients.forEach(client => client.terminate());
  adb('shell', 'rm', '-f', '/sdcard/synco-window.xml');
}
