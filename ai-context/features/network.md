# Network

Updated: 2026-10-04

## Status
Working Android phone-host WS and JS guest client. Native binary migration accepted but not implemented.

## Code paths
apps/mobile/modules/synco-host; apps/mobile/src/services/network/phone-host.ts; websocket-transport.ts; packages/protocol.

## Current decisions
AUDIO_PCM is 20 ms mono 48 kHz PCM16, base64/JSON under 4 KiB; TS admits guests and validates messages.
Host native fan-out drops audio above 16 KiB queued; controls reject above 64 KiB. Max eight connections, 30 inbound messages/sec, five-second HELLO timeout. Binary packets currently rejected.

## Accepted next direction
Native binary sender AND receiver; keep WS/PCM initially. No per-frame PCM crossing JS.
Wire contracts remain owned by packages/protocol; generate native codec/validators and shared fixtures.
Native delivery must be tied to admitted socket and stream epoch, revoked immediately on close/replacement.
Detailed phases and gates: docs/NATIVE-AUDIO-PLAN.md. No UDP/WebRTC or codec change yet.

## Evidence
20 automated tests and native build passed before the planning turn. Phone-host/guest and two-phone click smoke passed.
Live music confirmed continuous but delayed after queue fixes; zero sequence gaps observed for 80 seconds.
See docs/validation/live-music-2026-10-04.md. No acoustic latency measurement.

## Open risks
WS unencrypted; no native binary path, streaming reconnect or physical eight-listener validation.

## Next action
Baseline queue/timing metrics; shared binary protocol/capability contract with malformed/admission tests.
