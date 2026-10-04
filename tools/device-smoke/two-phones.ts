import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { decodeJoinCode } from '../../packages/protocol/src/index.ts';

const [host, guest] = process.argv.slice(2);
assert.ok(host && guest && host !== guest, 'Usage: two-phones.ts HOST_ADB_SERIAL GUEST_ADB_SERIAL');
const adb = (serial: string, ...args: string[]) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8' });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function dump(serial: string): string {
  adb(serial, 'shell', 'uiautomator', 'dump', '/sdcard/synco-window.xml');
  return adb(serial, 'shell', 'cat', '/sdcard/synco-window.xml');
}
function tap(serial: string, xml: string, label: string): void {
  const node = xml.split('<node').find(part => part.includes(`content-desc="${label}"`));
  const bounds = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert.ok(bounds, `Visible control required: ${label}`);
  assert.ok(Number(bounds[3]) > Number(bounds[1]), `Control must be on screen: ${label}`);
  adb(serial, 'shell', 'input', 'tap', String(Math.round((Number(bounds[1]) + Number(bounds[3])) / 2)), String(Math.round((Number(bounds[2]) + Number(bounds[4])) / 2)));
}
try {
  let hostUi = dump(host);
  if (!hostUi.includes('Hosting on this phone')) {
    tap(host, hostUi, 'Find Wi-Fi addresses'); hostUi = dump(host);
    const label = hostUi.match(/content-desc="(Host on [\d.]+)"/)?.[1];
    assert.ok(label, 'Host must have a LAN IPv4 address');
    tap(host, hostUi, label); hostUi = dump(host);
  }
  // Transfer the validated session code only in memory. Never log or save the token.
  const code = hostUi.match(/text="(synco:\/\/join\?ip=[^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
  assert.ok(code, 'Host must expose a join code');
  const join = decodeJoinCode(code);
  assert.match(join.token, /^[a-f0-9]+$/);
  let guestUi = dump(guest);
  if (!guestUi.includes('Leave phone session')) {
    tap(guest, guestUi, 'Synco join code');
    adb(guest, 'shell', 'input', 'keyevent', 'KEYCODE_MOVE_END');
    const existing = guestUi.split('<node').find(part => part.includes('content-desc="Synco join code"'))?.match(/text="([^"]*)"/)?.[1] ?? '';
    if (existing.length) adb(guest, 'shell', 'input', 'keyevent', ...Array.from({ length: Math.min(existing.length, 1024) }, () => 'KEYCODE_DEL'));
    adb(guest, 'shell', 'input', 'text', `'${code}'`);
    adb(guest, 'shell', 'input', 'keyevent', 'KEYCODE_BACK');
    guestUi = dump(guest); tap(guest, guestUi, 'Join phone session');
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    await delay(1000); hostUi = dump(host); guestUi = dump(guest);
    if (hostUi.includes('1 joined / 1 clock-ready') && guestUi.includes('Clock ready')) break;
  }
  assert.ok(hostUi.includes('1 joined / 1 clock-ready') && guestUi.includes('Clock ready'), 'Physical guest must become clock-ready');
  console.log('PASS: physical phone guest joined the phone host over LAN and became clock-ready');
  tap(host, hostUi, 'Play together in 3 seconds');
  await delay(11000);
  for (let attempt = 0; attempt < 5; attempt++) {
    hostUi = dump(host); guestUi = dump(guest);
    if (hostUi.includes('Finished 8 clicks') && guestUi.includes('Finished 8 clicks')) break;
    await delay(2000);
  }
  assert.ok(hostUi.includes('Finished 8 clicks') && guestUi.includes('Finished 8 clicks'), 'Both phones must finish scheduled playback');
  console.log('PASS: both physical phones report finishing the shared eight-click start. Acoustic alignment remains unmeasured.');
  console.log('Session left open for listening and recording repeats.');
} finally {
  for (const serial of [host, guest]) adb(serial, 'shell', 'rm', '-f', '/sdcard/synco-window.xml');
}

