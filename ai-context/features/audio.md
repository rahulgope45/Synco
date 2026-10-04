# Audio

Updated: 2026-10-04

## Status
Scheduled clicks use react-native-audio-api 0.13.6. Experimental UID-filtered Android playback capture and native AudioTrack live receiver added; see docs/LIVE-MUSIC.md.

## Code paths
apps/mobile/src/services/audio/click-engine.ts; docs/DEVICE-TEST.md

## Decisions
Generate eight identical quiet clicks; schedule against AudioContext.currentTime. Map performance.now using a bracketed native clock read. Reject starts with less than 100 ms lead.

## Evidence
ReVanced Music 8.10.52 capture passed on RMX3085: peak 29670, 2,880,000 stereo samples in 30 seconds. User confirmed continuous but delayed live music on V2146 after sender queue fixes; zero missing frames over an observed 80-second interval; stop propagated. docs/validation/live-music-2026-10-04.md.
Two physical Android phones passed join/readiness/group-click smoke; user heard both as one beat. See docs/validation/two-phones-2026-10-04.md. Acoustic timing remains unmeasured.
Typecheck, lint and 15 Jest tests passed. Simulator probe/malformed-message smoke passed.
Native build/install/launch passed on RMX3085 Android 13.
User confirmed local clicks audible; computer-host PLAY_AT completed; background cleanup passed.
Evidence: docs/validation/device-smoke-2026-10-04.md.

## Open risks
Acoustic latency and cross-device alignment unmeasured. Native build/device smoke passed. File decoding/streaming adapter is still unimplemented.

## Next action
Record repeated starts on the tested pair and measure acoustic error.
