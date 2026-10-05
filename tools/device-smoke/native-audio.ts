import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import WebSocket from 'ws';
import { decodeJoinCode, decodeMessage } from '../../packages/protocol/src/index.ts';

const serial = process.argv[2];
if (!serial) throw new Error('Usage: node --experimental-strip-types tools/device-smoke/native-audio.ts ADB_SERIAL');
const waitStop = process.argv.includes('--wait-stop');
const adb = (...args: string[]) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8' });
const spec = JSON.parse(readFileSync(new URL('../../packages/protocol/src/audio-wire.json', import.meta.url), 'utf8')) as {
  magic: number; version: number; headerBytes: number; sampleRate: number; channels: number;
  encoding: number; samplesPerFrame: number; pcmBytes: number; maxPacketBytes: number;
};
const xmlPath = '/sdcard/synco-native-audio.xml';
try {
  adb('shell', 'uiautomator', 'dump', xmlPath);
  const xml = adb('shell', 'cat', xmlPath);
  const code = xml.match(/text="(synco:\/\/join\?ip=[^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
  if (!code) throw new Error('Create a phone session in Synco first');
  const join = decodeJoinCode(code);
  const socket = await new Promise<WebSocket>((resolve, reject) => {
    const client = new WebSocket(`ws://${join.ip}:${join.port}`, { handshakeTimeout: 5000 });
    client.once('open', () => resolve(client)); client.once('error', reject);
  });
  let welcomed = false; let received = 0; let nonzero = 0;
  let previous: number | undefined; let epoch: number | undefined; let samplePosition: number | undefined;
  try {
    const result = await new Promise<{ received: number; nonzero: number; epoch: number; stopped: boolean }>((resolve, reject) => {
      let waitingStop = false;
      let timeout = setTimeout(() => reject(new Error('Timed out waiting for 100 native PCM packets')), 90000);
      socket.on('message', (raw, isBinary) => {
        try {
          if (!isBinary) {
            const message = decodeMessage(raw.toString());
            if (message.type === 'WELCOME' && !welcomed) {
              assert.equal(message.audioWire, spec.version);
              welcomed = true; socket.send(JSON.stringify({ type: 'READY', v: 1, ready: true }));
              console.log('Ready: start sharing app audio on the host phone');
            }
            if (message.type === 'AUDIO_STOP' && waitingStop) {
              clearTimeout(timeout); resolve({ received, nonzero, epoch: epoch!, stopped: true });
            }
            return;
          }
          assert.ok(welcomed, 'audio before admission');
          assert.ok(Buffer.isBuffer(raw), 'expected one binary WebSocket frame');
          const bytes = raw;
          assert.equal(bytes.byteLength, spec.maxPacketBytes);
          const frame = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          assert.equal(frame.getUint32(0, true), spec.magic);
          assert.equal(frame.getUint8(4), spec.version);
          assert.equal(frame.getUint8(5), spec.headerBytes);
          assert.equal(frame.getUint8(6), spec.encoding);
          assert.equal(frame.getUint8(7), spec.channels);
          assert.equal(frame.getUint32(20, true), spec.sampleRate);
          assert.equal(frame.getUint16(24, true), spec.samplesPerFrame);
          assert.equal(frame.getUint16(26, true), spec.pcmBytes);
          assert.equal(frame.getUint32(28, true), 0);
          const currentEpoch = frame.getUint32(8, true);
          if (epoch !== undefined) assert.equal(currentEpoch, epoch, 'stream epoch changed mid-run');
          epoch = currentEpoch;
          const seq = frame.getUint32(12, true);
          if (previous !== undefined) assert.ok(((seq - previous) >>> 0) > 0, 'out-of-order packet');
          const currentPosition = frame.getUint32(16, true);
          if (samplePosition !== undefined) assert.ok(((currentPosition - samplePosition) >>> 0) > 0, 'capture position did not advance');
          samplePosition = currentPosition;
          previous = seq; received++;
          for (let i = spec.headerBytes; i < bytes.length; i++) if (bytes[i] !== 0) nonzero++;
          if (received === 100) {
            clearTimeout(timeout);
            if (waitStop) {
              waitingStop = true;
              timeout = setTimeout(() => reject(new Error('Host did not propagate AUDIO_STOP')), 30000);
              console.log('100 packets validated; tap Stop music sharing on the host');
            } else resolve({ received, nonzero, epoch: epoch!, stopped: false });
          }
        } catch (error) { clearTimeout(timeout); reject(error); }
      });
      socket.once('close', () => { clearTimeout(timeout); reject(new Error('Host closed during native audio smoke')); });
      socket.send(JSON.stringify({ type: 'HELLO', v: 1, token: join.token, deviceName: 'Native audio smoke', audioWire: spec.version }));
    });
    console.log(`PASS: ${result.received} validated binary PCM packets; ${result.nonzero} nonzero payload bytes; epoch ${result.epoch}; stop propagated ${result.stopped}`);
  } finally { socket.close(); }
} finally { try { adb('shell', 'rm', '-f', xmlPath); } catch { /* device may be offline */ } }
