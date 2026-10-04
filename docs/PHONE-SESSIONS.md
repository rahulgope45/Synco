# Phone-host sessions (Phase 0)

1. Put two Android phones on the same Wi-Fi network or hotspot and install the current Synco development build on both.
2. On the host, tap Find Wi-Fi addresses, then Host on the address for that network.
3. Long-press the displayed join code to copy it and give it to the guest. It contains a session token; do not publish it.
4. On the guest, paste the code and tap Join phone session.
5. Wait for the host to show a clock-ready guest, then tap Play together in 3 seconds.
6. Record both speakers to measure audible alignment. RTT/clock readiness alone is not evidence of audio alignment.

This currently plays the identical built-in eight-click track on each phone. Music-file sharing, QR scanning, group pause and drift correction are still pending.
Stop this phone's clicks only affects that phone. End/Leave phone session closes its session.
Both apps must stay foregrounded. Screen lock/background closes the host and guest in this experiment.
The native server binds to the selected local address, accepts at most eight connections, limits control frames to 4 KiB, and caps message rate per connection. Unauthenticated peers must send HELLO within five seconds.
Plain WebSocket has no encryption. The random 128-bit token is admission control, not confidentiality; each new host session rotates it.

## Protocol additions

WELCOME carries sessionId, hostTime and click-track metadata. READY carries a boolean acknowledgment after fresh clock probes. These are shared runtime-validated v1 pre-release control messages. CHUNK and STATE are not yet implemented.
The Android module only transports text/events; TypeScript owns the protocol/admission policy and scheduling.
Native source lives under apps/mobile/modules/synco-host; do not edit generated apps/mobile/android files.

## Reproduce device smoke tests

Create a phone session, keep the group-play button visible, then run from the repo root:

```sh
node --experimental-strip-types tools/device-smoke/phone-host.ts ADB_SERIAL
node --experimental-strip-types tools/device-smoke/phone-guest.ts ADB_SERIAL COMPUTER_LAN_IP
```

These scripts control the Synco test screen and trigger audible clicks. The first uses two simulated guests to test the phone host. The second ends the current host session and tests the phone as a guest against a temporary computer LAN server. Tokens stay in memory and temporary UI dumps are removed.
Neither script measures two physical phones' audible timing.
