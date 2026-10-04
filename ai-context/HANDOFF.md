# Resume Synco — native audio migration

Updated: 2026-10-04. This turn is planning/documentation only; migration is NOT implemented.

## Accepted user intent
Synco only connects phones and shares an existing music app's output; people use their own earphones.
Do not add a player, local-file library, playlists or source-app controls. The user explicitly rejected that expansion.
User selected native audio delivery: capture -> binary native network -> native receiver/output.
Retain React Native + TS for UI/control; Android first. Keep WebSocket/PCM/AudioTrack for the first comparison.
Current request: phased plan and next-model handover. No implementation was performed in this turn.

## Read next
1. AGENTS.md and ai-context/INDEX.md.
2. docs/NATIVE-AUDIO-PLAN.md: phases, gates, scope and unresolved design details.
3. ai-context/features/network.md and audio.md; sync.md for timing work.
4. .agents/skills/feature-context/SKILL.md and sync-spike/SKILL.md when implementing/measuring.

## First implementation slice when resumed
Phase A: stage/queue/underrun metrics and acoustic result template.
Phase B: versioned binary framing/negotiation and TS/native fixtures owned by packages/protocol.
Generate native codec/validation from the shared protocol source; do not bypass validation to avoid JS.
Then migrate BOTH sender and guest receive path; PCM must never cross JS in the new mode.
Keep baseline buffers/format/transport for the first native-path A/B comparison; tune afterward.
Missing recording equipment blocks acoustic claims, not independent instrumentation/contract work.
UDP/WebRTC, codec changes, a music player and iOS are not initial migration tasks.

## Current implementation and evidence
Working: token admission, phone-host native WS, JS guest WS, clock probes, scheduled diagnostic clicks.
Live: native AudioRecord -> base64/JS -> native host WS -> guest JS -> native AudioTrack.
48 kHz mono PCM16; 20 ms packets; 100 ms startup cushion; 300 ms receiver queue capacity.
AudioTrack capacity >=100 ms; capture capacity >=200 ms. Capacities are NOT measured latency.
Source fixed to app.revanced.android.apps.youtube.music, chosen by user. Official YT Music/Spotify unverified.
User confirmed continuous but delayed music; zero missing frames over 80 seconds; stop propagated.
20 tests, typecheck/lint, native build/install and post-stream two-phone clicks passed before this docs turn.
No acoustic latency distribution, route calibration, native binary stream or synchronized live playback yet.
Evidence: docs/validation/live-music-2026-10-04.md; docs/LIVE-MUSIC.md.

## Code map
Native folder: apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost/.
CaptureProbeModule.kt: source UID, consent/service, AudioRecord and per-frame base64 events.
SyncoHostModule.kt: text WS, bounded queues, native fan-out; binary messages currently rejected.
LivePcmPlayer.kt: base64 decoder, bounded queue and blocking AudioTrack output.
Control: apps/mobile/src/services/sync/spike-session.ts; services/network/phone-host.ts and websocket-transport.ts.
Protocol/admission: packages/protocol/src/index.ts and host-admission.ts; pure clocks: packages/sync-core.
Guest disconnects in background; host capture has a foreground service. Preserve consent/stop behavior.

## Devices, build and tracking
Windows PowerShell; E:/Projects/Synco. Recheck adb devices because serials/addresses can change.
Last devices: RMX3085 Android 13, 192.168.1.38:43357; V2146 Android 13, 192.168.1.40:37879.
RMX3085 last had development build; V2146 standalone test build. Do not assume matching versions.
Baseline APK: dist/synco-0.1.0-arm64-test.apk (Git-ignored); checksum/build recipe in docs/APK.md.
Checkpoints: b510a98 live sharing; ae54142 standalone APK config. See git log for subsequent docs commits.
Use Git bin + usr/bin on PATH for native Windows builds. Do not hand-edit generated apps/mobile/android.
Persistent LAN config: apps/mobile/plugins/with-lan-network.js. Existing WS transport is unencrypted.
User requests tested local commits with context updates; no push. Never commit tokens/audio/build artifacts.

## Limits to preserve
Capture leaves source-app playback timing unchanged; native delivery does not guarantee host-earphone alignment.
RTT, clock-ready and zero frame gaps do not measure acoustic alignment or output underruns.
Measure Bluetooth/output routes separately. Hotspot is an experiment, not a guaranteed latency fix.
Compatibility evidence covers only the tested source app/version/device; never claim universal support.
