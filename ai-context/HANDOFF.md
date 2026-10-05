# Resume Synco — native binary audio

Updated: 2026-10-05.

## Product and boundaries
Synco shares an existing host music app's captured output to joined phones on local Wi-Fi/hotspot. The music app owns playback controls. Android/React Native+TS; no player, accounts or backend. Source remains the user-selected ReVanced Music package on the host.

## Current stage
Native binary migration implemented in code: playback capture -> bounded native host queue -> binary WebSocket -> native guest validation/buffer/AudioTrack. Text controls, token admission and ready gate remain in TS. No PCM/base64 frame crosses JS in the new phone mode. Wire v2 capability is required in HELLO/WELCOME; old APKs are intentionally incompatible.

Phase A aggregate counters and a physical-result template exist, but matching acoustic baseline is still missing. Phase B contract/generated Kotlin codec and TS negative tests pass. Phase C compiles; a two-phone stream test is still required. Do not claim lower audible latency until measured. Phase D buffer tuning, E multi-listener alignment/drift and F background/reconnect/standalone validation remain pending.

## Next concrete action
Reconnect V2146; install matching new builds on both phones. Run consent, ReVanced stream, stop/restart, disconnect and click regressions. Record host/listener speaker output on one timebase for at least 20 onsets and a five-minute run, comparing the saved base64 APK where possible. Use `docs/validation/native-audio-2026-10-05.md`. Tune buffer only after identifying dominant delay/underruns.

## Paths and checks
Wire source: `packages/protocol/src/audio-wire.json` and `.ts`; generator `scripts/generate-audio-wire.mjs` -> `AudioWire.kt`; `npm run wire:check` guards drift.
Native: `apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost/` (`SyncoHostModule`, `SyncoGuestModule`, `CaptureProbeModule`, `LivePcmPlayer`). TS: `phone-host.ts`, `native-guest-transport.ts`, `spike-session.ts`.
`npm run check` passed (23 tests, typecheck, lint, wire check); final arm64 debug APK compiled offline. Matching prior debug build was installed on RMX3085 and V2146, but Wi-Fi went down before a physical guest stream. RMX3085 passed control smoke and 100 valid native binary packets to a simulated listener; all packets were silent, so audible latency/output remains untested. See validation record. Final native lifecycle fixes were built but not installed. ADB dropped while capture was active; user was asked to tap Stop on the host notification.

## Limits
Receiver starts after five 20 ms frames and keeps a 15-frame bounded queue; this has not been tuned. Counters are not acoustic latency. Output routes/Bluetooth add independent delay. Host source playback cannot be delayed by Synco. Guest stops in background; reconnect is not yet automatic. Legacy standalone APK remains in ignored `dist/` as baseline.
