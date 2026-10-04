# Audio

Updated: 2026-10-04

## Status
Phase-0 native click engine implemented with react-native-audio-api 0.13.6.

## Code paths
apps/mobile/src/services/audio/click-engine.ts; docs/DEVICE-TEST.md

## Decisions
Generate eight identical quiet clicks; schedule against AudioContext.currentTime. Map performance.now using a bracketed native clock read. Reject starts with less than 100 ms lead.

## Evidence
Typecheck, lint and 15 Jest tests passed. Simulator probe/malformed-message smoke passed.
Native build/install/launch passed on RMX3085 Android 13.
User confirmed local clicks audible; computer-host PLAY_AT completed; background cleanup passed.
Evidence: docs/validation/device-smoke-2026-10-04.md.

## Open risks
Acoustic latency and cross-device alignment unmeasured. Native build/device smoke passed. File decoding/streaming adapter is still unimplemented.

## Next action
Use the implemented phone-host path to compare two phones on hotspot.
