# Network

Updated: 2026-10-04

## Status
WebSocket guest transport and computer simulator implemented.

## Code paths
apps/mobile/src/services/network/websocket-transport.ts; tools/sim-host/index.ts

## Decisions
Simulator binds loopback only, accessed via adb reverse. Validate messages, cap payload, timeout connections. UI calls state/actions.

## Evidence
Typecheck, lint and 15 Jest tests passed. Simulator probe/malformed-message smoke passed.
Native build/install/launch passed on RMX3085 Android 13.
User confirmed local clicks audible; computer-host PLAY_AT completed; background cleanup passed.
Evidence: docs/validation/device-smoke-2026-10-04.md.

## Open risks
Phone-host LAN server, admission, QR and streaming remain unimplemented. ADB transport results do not characterize hotspot latency.

## Next action
Implement phone-host transport and token admission; measure on a real hotspot.
