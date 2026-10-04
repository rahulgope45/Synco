# Sync

Updated: 2026-10-04

## Status
Host and guest group-start path integrated with native click scheduling.

## Code paths
apps/mobile/src/services/sync/spike-session.ts; packages/sync-core/src/probe-tracker.ts

## Decisions
Three fresh matched probes enable readiness. Only the host issues PLAY_AT, 3 s ahead. Low RTT/clock readiness is not an audible-alignment claim.

## Evidence
Two physical Android phones passed join/readiness/group-click smoke; user heard both as one beat. See docs/validation/two-phones-2026-10-04.md. Acoustic timing remains unmeasured.
Native Android build/install passed; 19 automated tests passed.
Live phone-host (2 simulated guests) and phone-guest LAN smoke tests passed.
See docs/validation/phone-network-2026-10-04.md.

## Open risks
No two-phone acoustic result yet; no sustained drift correction or calibration persistence.

## Next action
Run repeated physical two-phone starts and record waveform alignment.

