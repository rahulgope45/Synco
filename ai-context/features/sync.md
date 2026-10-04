# Sync

Updated: 2026-10-04

## Status
Probe correlation, duplicate/late rejection, freshness gate and remote PLAY_AT integration implemented.

## Code paths
packages/sync-core/src/probe-tracker.ts; apps/mobile/src/services/sync/spike-session.ts

## Decisions
Minimum RTT of eight samples; require three matched replies; expire after 15 s without replies; reset on disconnect; native scheduling rejects late starts.

## Evidence
Typecheck, lint and 15 Jest tests passed. Simulator probe/malformed-message smoke passed.
Native build/install/launch passed on RMX3085 Android 13.
User confirmed local clicks audible; computer-host PLAY_AT completed; background cleanup passed.
Evidence: docs/validation/device-smoke-2026-10-04.md.

## Open risks
Clock mapping and output latency require acoustic measurement. No drift correction or user-delay persistence yet.

## Next action
Add phone-host transport and measure two-phone acoustic alignment.
