# Network

Updated: 2026-10-05.

## Status
Native binary WebSocket sender/guest receiver implemented; physical two-phone audio validation pending. TS still validates text controls and admits guests. No PCM enters JS for phone streaming.

## Paths
`packages/protocol/src/audio-wire.json`, `audio-wire.ts`, `index.ts`, `host-admission.ts`; `scripts/generate-audio-wire.mjs`; native `AudioWire.kt`, `SyncoHostModule.kt`, `SyncoGuestModule.kt`; TS `phone-host.ts`, `native-guest-transport.ts`, `spike-session.ts`.

## Decisions
Wire v2 capability required on HELLO/WELCOME; old APKs rejected. Fixed 32-byte LE header + 1920-byte PCM16 mono payload (48 kHz, 20 ms). Header carries epoch, sequence and capture sample position (not wall time). TS spec generates Kotlin codec; length/format/version validated natively.
Host rejects all guest binary input. Native audio readiness is bound to the actual admitted socket and removed on close. Each capture restart gets a new epoch. Host queue holds eight packets; per-guest WebSocket backlog limited to 16 KiB. Controls retain 4096-byte and 30/s limits; max eight sockets.

## Evidence and risks
`npm run check` (23 tests) and final offline arm64 debug build pass. RMX3085 control smoke passed with two simulated guests, rejection paths and guest departure. One admitted simulated listener received 100 validated native binary packets. Both phones had a prior matching debug build, but Wi-Fi failed before two-phone output validation. No acoustic comparison yet. WebSocket remains unencrypted; no automatic reconnect/background listener service.

## Next action
Test actual host+guest stream, binary admission rejection, stop/restart and slow-guest isolation; then measure source-to-listener audible delay. See `docs/validation/native-audio-2026-10-05.md`.
