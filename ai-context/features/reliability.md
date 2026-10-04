# Reliability

Updated: 2026-10-04

## Status
Interactive Phase-0 screen and session cleanup implemented.

## Code paths
apps/mobile/src/ui/StatusScreen.tsx; apps/mobile/src/state/spike-store.ts

## Decisions
Show unknown metrics until fresh probes exist; show errors; disconnect and close audio when app backgrounds.

## Evidence
Typecheck, lint and 15 Jest tests passed. Simulator probe/malformed-message smoke passed.
Native build/install/launch passed on RMX3085 Android 13.
User confirmed local clicks audible; computer-host PLAY_AT completed; background cleanup passed.
Evidence: docs/validation/device-smoke-2026-10-04.md.

## Open risks
Foreground/background playback and recovery are later-phase work. Current experiment intentionally stops on background.

## Next action
Add the phone-host path, then run physical disconnect/rejoin tests.
