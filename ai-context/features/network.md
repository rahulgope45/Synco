# Network

Updated: 2026-10-04

## Status
Android phone-host WebSocket and LAN guest path implemented.

## Code paths
apps/mobile/modules/synco-host; apps/mobile/src/services/network/phone-host.ts; websocket-transport.ts

## Decisions
Native server binds selected local IPv4; max 8 connections, 4 KiB controls, 30 messages/sec/connection. TS validates all messages; pending admission expires in 5 s.

## Evidence
Native Android build/install passed; 19 automated tests passed.
Live phone-host (2 simulated guests) and phone-guest LAN smoke tests passed.
See docs/validation/phone-network-2026-10-04.md.

## Open risks
No compressed chunks, backpressure for streaming, auto-reconnect, or iOS host yet. Plain WS is unencrypted.

## Next action
Connect a second Android phone and measure audible alignment; then implement streaming framing.
