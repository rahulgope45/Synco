# 1. What we have built

Synco is an **Android audio-sharing prototype**. One phone hosts a local session and captures playback from the selected music app. Other phones join and receive the audio. Everyone can use their own output device. The source music app continues to own song selection and playback controls.

## Your 30-second introduction

> Synco explores sharing one phone's music with nearby people using their own earphones. I built it using React Native and TypeScript, with Kotlin modules for Android playback capture and audio transport. The current redesign sends 20-millisecond PCM chunks through a native binary WebSocket path. Host capture and delivery are tested; real-device receiver validation and latency measurement are the next milestones.

Use “I built” only alongside an honest account of your AI-assisted workflow and the parts you personally understand. See [ownership preparation](08-ownership-preparation.md).

## Your 90-second architecture explanation

The app separates session control from the frequent audio data. React Native renders the screen, Zustand stores state, and TypeScript services manage joining, readiness, clock probes and commands. Zod validates control messages at runtime.

Android Kotlin modules handle capture, binary transmission and receiver playback. The new music path keeps PCM frames outside JavaScript. That removes Base64 conversion and per-frame JS handoffs from this path, although native allocations and network buffering still exist.

The guest has a bounded queue and an AudioTrack writer. This balances continuous playback against delay. We have not yet measured the redesigned path on two physical phones, so the architectural improvement is established but its audible latency benefit is not.

## Two paths to draw on a whiteboard

```text
Control:
Screen -> Zustand actions -> TypeScript session/services
       -> validated text commands -> native/network adapters

Live audio:
Source music app
  -> Android playback capture / AudioRecord
  -> 20 ms PCM chunks
  -> bounded native host queue
  -> binary WebSocket fan-out
  -> native guest validation and bounded playback queue
  -> AudioTrack -> listener output
```

Do not draw live PCM passing through Zustand. Do not draw the clock estimator scheduling live music: that integration is not implemented.

## What each part owns

| Part | Responsibility | Starting point |
| --- | --- | --- |
| UI | Buttons, inputs, status and diagnostics | [StatusScreen.tsx](../../apps/mobile/src/ui/StatusScreen.tsx) |
| State | User actions, session state, stale-callback guards | [state directory](../../apps/mobile/src/state) |
| Services | Admission, readiness, lifecycle, adapter orchestration | [spike-session.ts](../../apps/mobile/src/services/sync/spike-session.ts), [phone-host.ts](../../apps/mobile/src/services/network/phone-host.ts) |
| Protocol | Wire formats and runtime validation | [protocol source](../../packages/protocol/src) |
| Sync core | Clock math and probe tracking, independent of RN/network | [sync-core source](../../packages/sync-core/src) |
| Native Android | Capture, sockets, PCM buffering and AudioTrack | [native modules](../../apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost) |
| Click adapter | Schedules an experimental click sequence on the audio clock | [click-engine.ts](../../apps/mobile/src/services/audio/click-engine.ts) |
| Test tools | Simulated peers and physical-host smoke checks | [device-smoke](../../tools/device-smoke) |

## Technology choices you should explain

- **React Native + strict TypeScript:** typed application logic and a familiar UI stack. Native modules handle Android-specific audio work.
- **Expo development builds:** Expo tooling with our own native modules. Expo Go cannot run these modules.
- **Kotlin:** direct access to Android capture, playback and lifecycle APIs.
- **Zustand:** small state layer; services hold orchestration rather than growing component logic.
- **Zod:** incoming network data needs runtime checks; TypeScript types alone cannot protect a running app.
- **WebSocket:** a practical local prototype transport for binary audio and text control. TCP reliability can also create late delivery.
- **Jest + npm workspaces:** test shared logic and keep protocol/sync packages reusable.

## Current delivery

The standalone ARM64 test APK is `dist/synco-0.1.0-native-arm64-test.apk`. It includes JavaScript and needs neither Metro nor Expo Go. It uses a development/test signing key, so it is not a production-store release.

The selected source is the installed ReVanced Music package. There is no verified universal capture support, Spotify integration or official YouTube Music compatibility claim. QR scanning, automatic reconnect and background listener playback are not complete.

## Evidence to remember

The recorded software check passed 23 Jest tests, typecheck, lint and generated-wire consistency. A physical host sent valid non-silent binary packets to simulated listeners. Stop ended capture, and restarting created a different stream epoch. Two simulated peers passed control tests.

These results do not replace a second phone playing through AudioTrack. The next acceptance test is an audible native guest run followed by measured delay and dropouts. See [validation](../validation/native-audio-2026-10-05.md).
