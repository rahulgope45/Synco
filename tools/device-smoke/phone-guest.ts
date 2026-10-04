import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { decodeMessage, encodeJoinCode } from '../../packages/protocol/src/index.ts';
import { HostAdmission } from '../../packages/protocol/src/host-admission.ts';

const [serial, hostIp] = process.argv.slice(2);
if (!serial || !hostIp) throw new Error('Usage: phone-guest.ts ADB_SERIAL COMPUTER_LAN_IP');
const token = randomBytes(16).toString('hex');
const code = encodeJoinCode({ ip: hostIp, port: 8789, token, protocolVersion: 1 });
const policy = new HostAdmission(token, 'guest-smoke', () => performance.now());
const server = new WebSocketServer({ host: hostIp, port: 8789, maxPayload: 4096 });
const adb = (...args: string[]) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8' });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function dump(): string {
  adb('shell', 'uiautomator', 'dump', '/sdcard/synco-window.xml');
  return adb('shell', 'cat', '/sdcard/synco-window.xml');
}
function tap(xml: string, label: string): void {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const node = xml.match(new RegExp(`<node[^>]*content-desc="${escaped}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`));
  assert.ok(node, `${label} must be visible`);
  adb('shell', 'input', 'tap', String(Math.round((Number(node[1]) + Number(node[3])) / 2)), String(Math.round((Number(node[2]) + Number(node[4])) / 2)));
}
let scheduled = false;
let connections = 0;
server.on('connection', socket => {
  const id = String(++connections);
  socket.on('message', raw => {
    try {
      const message = decodeMessage(raw.toString());
      const response = policy.receive(id, message);
      if (response === 'close') socket.close(1008);
      else if (response) socket.send(JSON.stringify(response));
      if (message.type === 'READY' && message.ready && policy.has(id)) {
        scheduled = true;
        socket.send(JSON.stringify({ type: 'PLAY_AT', v: 1, hostTime: performance.now() + 3000, positionMs: 0 }));
      }
    } catch { socket.close(1008); }
  });
  socket.on('close', () => policy.remove(id));
});
try {
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  let xml = dump();
  if (xml.includes('content-desc="End phone session"')) { tap(xml, 'End phone session'); xml = dump(); }
  tap(xml, 'Synco join code');
  // The code is generated from validated IPv4/numeric fields and a hex token; single quotes keep & literal in Android's shell.
  adb('shell', 'input', 'text', `'${code}'`);
  adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
  xml = dump(); tap(xml, 'Join phone session');
  let finished = false;
  for (let attempt = 0; attempt < 7; attempt++) {
    await delay(2000); xml = dump();
    if (scheduled && xml.includes('Finished 8 clicks') && xml.includes('Clock ready')) { finished = true; break; }
  }
  assert.ok(finished, 'Phone must admit, synchronize and finish host-scheduled clicks');
  console.log('PASS: phone joined a token-protected LAN host, reached clock-ready, and completed PLAY_AT');
  tap(xml, 'Leave phone session');
  await delay(300);
  assert.equal(policy.count, 0);
  console.log('PASS: leaving the phone session closed the guest connection');
} finally {
  server.clients.forEach(client => client.terminate()); server.close();
  adb('shell', 'rm', '-f', '/sdcard/synco-window.xml');
}
