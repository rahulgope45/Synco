# Reliability

Updated: 2026-10-04

## Status
Foreground phone-session lifecycle implemented and smoke-tested.

## Code paths
apps/mobile/src/state/spike-store.ts; services/sync/spike-session.ts; modules/synco-host

## Decisions
Generation guards discard stale callbacks; local state resets on close. Native host also stops on Android activity background.

## Evidence
Native Android build/install passed; 19 automated tests passed.
Live phone-host (2 simulated guests) and phone-guest LAN smoke tests passed.
See docs/validation/phone-network-2026-10-04.md.

## Open risks
No background playback or automatic reconnect yet; hotspot isolation and connection-pressure tests pending.

## Next action
After acoustic gate, harden reconnect/streaming and background lifecycle.
