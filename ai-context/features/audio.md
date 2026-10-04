# Audio

Updated: 2026-10-04

## Status
UID-filtered Android app playback capture and native AudioTrack receiver work through a JS/base64 transport.
Native audio delivery accepted; not implemented. Synco remains an audio-sharing layer, not a music player.

## Code paths
apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost/CaptureProbeModule.kt and LivePcmPlayer.kt.
apps/mobile/src/services/audio/capture-probe.ts; services/sync/spike-session.ts; click-engine.ts diagnostic.

## Current decisions
48 kHz mono PCM16, 20 ms frames. Receiver waits for five frames (100 ms); queue holds at most 15 (300 ms).
AudioTrack capacity >=100 ms; AudioRecord capacity >=200 ms. Capacity is not measured latency.
Keep capture consent, UID filter, foreground notification, Stop/revocation and bounded queues.
Source fixed to installed ReVanced Music; no source-player controls, file library or local-file playback roadmap.

## Accepted next direction
Capture -> native binary WS -> native receiver/output; TS owns UI/session controls only.
Keep format, WS and AudioTrack unchanged for first A/B test; tune buffers after isolating migration effects.
Oboe/AAudio is a conditional later experiment. See docs/NATIVE-AUDIO-PLAN.md.

## Evidence
ReVanced Music 8.10.52 capture verified on RMX3085; user confirmed continuous but delayed playback on V2146.
Zero sequence gaps over 80 seconds; stop propagated; shared-click regression passed. Twenty automated tests passed.
See docs/validation/live-music-2026-10-04.md and docs/APK.md for existing artifact evidence.

## Open risks
No acoustic latency distribution, Bluetooth route measurement or native binary delivery yet.
Capture does not control source-app output timing; no host-earphone sync guarantee. Official YT Music/Spotify unverified.

## Next action
Add aggregate stage/queue/underrun telemetry, record baseline, then migrate both ends under shared binary contract.
