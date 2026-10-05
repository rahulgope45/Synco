# Resume Synco — native binary audio

Updated: 2026-10-05.

## Product and boundaries
Synco shares an existing host music app's captured output to joined phones on local Wi-Fi/hotspot. The music app owns playback controls. Android/React Native+TS; no player, accounts or backend. Source remains the user-selected ReVanced Music package on the host.

## Current stage
Native binary migration implemented in code: playback capture -> bounded native host queue -> binary WebSocket -> native guest validation/buffer/AudioTrack. Text controls, token admission and ready gate remain in TS. No PCM/base64 frame crosses JS in the new phone mode. Wire v2 capability is required in HELLO/WELCOME; old APKs are intentionally incompatible.

Phase A aggregate counters and a physical-result template exist, but matching acoustic baseline is still missing. Phase B contract/generated Kotlin codec and TS negative tests pass. Phase C compiles; a two-phone stream test is still required. Do not claim lower audible latency until measured. Phase D buffer tuning, E multi-listener alignment/drift and F background/reconnect/standalone validation remain pending.

## Next concrete action
When the second phone is available, install the same standalone `dist/synco-0.1.0-native-arm64-test.apk` on it. Run real guest playback, stop/restart, disconnect and click regressions. Record host/listener speaker output on one timebase for at least 20 onsets and a five-minute run, comparing the saved base64 APK where possible. Use `docs/validation/native-audio-2026-10-05.md`. Tune buffer only after identifying dominant delay/underruns.

## Paths and checks
Wire source: `packages/protocol/src/audio-wire.json` and `.ts`; generator `scripts/generate-audio-wire.mjs` -> `AudioWire.kt`; `npm run wire:check` guards drift.
Native: `apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost/` (`SyncoHostModule`, `SyncoGuestModule`, `CaptureProbeModule`, `LivePcmPlayer`). TS: `phone-host.ts`, `native-guest-transport.ts`, `spike-session.ts`.
`npm run check` passed (23 tests, typecheck, lint, wire check); arm64 debug/release builds passed. Exact standalone release APK installed and cold-launched on RMX3085 without Metro. With ReVanced playing, native binary packets had nonzero audio; two capture runs used distinct epochs and propagated Stop, with capture service stopped. Release control smoke passed with two simulated guests. No physical guest output or latency measurement yet. See validation record.
Release APK path/checksum: `docs/APK.md`. The earlier stuck capture service was found on ADB reconnection and force-stopped before release testing; current Synco host session was ended cleanly.

Learning material: `docs/interview/README.md` routes eight separate interview notes (2026-10-05 snapshot). These distinguish host evidence from pending physical guest/latency tests; update claims after future validation.

## Limits
Receiver starts after five 20 ms frames and keeps a 15-frame bounded queue; this has not been tuned. Counters are not acoustic latency. Output routes/Bluetooth add independent delay. Host source playback cannot be delayed by Synco. Guest stops in background; reconnect is not yet automatic. Legacy standalone APK remains in ignored `dist/` as baseline.
