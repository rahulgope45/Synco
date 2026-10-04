# Calibration

Updated: 2026-10-04

## Status
Planned; not implemented.

## Code paths
packages/sync-core/src/index.ts; apps/mobile/src/state/session-store.ts

## Decisions
Default 0 ms; +/-200 ms; persist on local device in Phase 2.

## Evidence
No physical-device verification yet. See foundation.md for automated validation.

## Open risks
Some Bluetooth routes exceed range; negative delay needs sufficient future lead/prebuffer.

## Next action
After measured sync, add slider + local persistence and route-change behavior.
