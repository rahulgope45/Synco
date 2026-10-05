# 7. Features to recreate yourself for deeper understanding

Rebuild small components from a written contract before reading their implementation. Then compare designs and explain the differences. Work in a separate practice branch or scratch directory so the working device build remains reproducible.

For each exercise: write the assumptions, implement it, add adversarial cases, explain one tradeoff aloud, and save the result. Ask AI to review your attempt after you have one, rather than asking it to generate the first answer.

## 1. PCM packet calculator — start here

**Build:** a small TypeScript function accepting sample rate, channel count, bytes per sample and frame duration. Return sample count, payload bytes and bitrate. Reject formats that produce a fractional sample count when the contract requires whole samples.

**Pass:** 48 kHz, mono, two bytes, 20 ms produces 960 samples and 1,920 payload bytes. Explain why changing duration changes packet frequency but not the raw PCM bitrate.

**Stretch:** compare mono/stereo and 5/10/20/40 ms frames, including header overhead. Label every unit.

**Then inspect:** [audio-wire.json](../../packages/protocol/src/audio-wire.json).

## 2. Binary encoder and validator

**Build:** encode/decode the current packet contract using typed arrays/DataView. Start from the JSON specification, not the existing encoder. Validate exact size, magic, version, encoding, channels, sample rate and reserved fields before exposing PCM.

**Pass:** a known valid packet round-trips; one-byte truncation, oversized payload and wrong version fail. Add boundary values for unsigned counters. A decoder must not crash or read outside the message.

**Stretch:** create a golden fixture consumed by both a TS test and a native codec test. Explain what code generation checks and what it does not prove.

**Then inspect:** [audio-wire.ts](../../packages/protocol/src/audio-wire.ts), [generator](../../scripts/generate-audio-wire.mjs).

## 3. Clock estimator without platform APIs

**Build:** the four-timestamp offset/RTT function and an eight-sample minimum-RTT window. Pass time values in; do not read Date.now or call the network inside the core.

**Pass:** reproduce the worked example in question 18, reject invalid elapsed intervals, and prove the chosen sample changes when a better RTT arrives. Test ties and window eviction.

**Stretch:** simulate asymmetric outward/return delay. Explain why the offset can be biased despite mathematically correct code.

**Then inspect:** [sync-core](../../packages/sync-core/src/index.ts).

## 4. Probe tracker and readiness

**Build:** track pending probe IDs/times, correlate replies, reject duplicates and expire stale readiness. Use an injected/fake clock in tests.

**Pass:** an unknown reply cannot make a guest ready; three valid replies can; no recent replies eventually removes readiness; a long gap resets old history.

**Stretch:** test duplicate timestamp/identifier assumptions and late replies from an earlier session. Explain why pure estimation and lifecycle tracking are separate responsibilities.

**Then inspect:** [probe-tracker.ts](../../packages/sync-core/src/probe-tracker.ts).

## 5. Session admission as a state machine

**Build:** a fake transport with states such as disconnected, connected, admitted and ready. Handle HELLO/WELCOME/READY/close with runtime validation. Keep the UI out of this exercise.

**Pass:** wrong-token and wrong-audio-version peers cannot reach ready; audio is unavailable before admission; leaving removes the peer. Invalid message order must have a defined outcome.

**Stretch:** simulate a guest leaving while another is ready, and a delayed callback arriving after a replacement session starts.

**Then inspect:** [phone-host.ts](../../apps/mobile/src/services/network/phone-host.ts), [protocol](../../packages/protocol/src).

## 6. Bounded queue and slow-listener simulator

**Build:** a deterministic producer/consumer simulation: one frame every 20 ms, variable network delay, multiple consumers. Implement drop-oldest and clear-backlog policies separately.

**Pass:** memory remains bounded. Report occupancy, dropped frames, overflow events and frame age as different values. A consumer that cannot keep up must not silently grow an unbounded queue.

**Stretch:** graph delay versus underruns while varying startup cushion. Explain why “smallest queue” is not necessarily the best listening experience.

**Then inspect:** [LivePcmPlayer.kt](../../apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost/LivePcmPlayer.kt) and the host worker. Simulated results do not certify Android behavior.

## 7. Stop/restart and stale-stream protection

**Build:** an epoch-aware receiver model. Send packets for A, stop A, start B, then deliberately deliver a late A packet and duplicate B packets.

**Pass:** stopped A cannot resume output, duplicate progression is rejected, and B starts with clean stream state. Add unsigned wrap cases.

**Stretch:** model a slow worker exiting after the next session starts. Decide which object owns cleanup so an old `finally` cannot erase a new session's state.

**Then inspect:** native guest/capture modules in [the Kotlin directory](../../apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost).

## 8. One-phone native audio exercise

**Build:** on a practice branch, generate a quiet known PCM test signal and feed it through the playback adapter. Separately trace capture consent, start, error and Stop for the selected permitted source.

**Pass:** identify the sample format, show why writes can be partial, stop cleanly and demonstrate how permission denial is handled. Keep volume comfortable. Do not infer network performance from a local playback test.

**Stretch:** design an accumulator for short capture reads before changing production code. Test chunk boundaries using a synthetic sequence so lost/duplicated samples are visible.

**Then inspect:** `CaptureProbeModule.kt`, `LivePcmPlayer.kt` and [capture-probe.ts](../../apps/mobile/src/services/audio/capture-probe.ts).

## 9. Recreate a small UI against a fake service

**Build:** Host, Join, Stop and Leave controls with a fake session service and typed state. Render status from state rather than storing socket objects in components.

**Pass:** invalid actions are unavailable; a late success from a disposed session does not overwrite the current one; errors are actionable; subscriptions are removed on teardown.

**Stretch:** replace the fake adapter with the real service without changing the UI's responsibilities.

**Then inspect:** [StatusScreen.tsx](../../apps/mobile/src/ui/StatusScreen.tsx) and [state](../../apps/mobile/src/state).

## 10. Two-phone measurement lab — when the device returns

**Build:** a reproducible test report for identical builds/routes on router Wi-Fi and hotspot. Use an authorized test signal and one recording timebase for both outputs.

**Pass:** report onset p50/p95/max, dropouts, drift and native counters; label unknowns; repeat after one controlled buffer change. Separate guest-to-guest skew from host-to-guest delay.

**Stretch:** introduce a slow peer, disconnect/rejoin, change route and background the listener. Record expected versus observed behavior rather than hiding failures.

**Then inspect:** [validation template](../validation/native-audio-2026-10-05.md).

## If you only have time for three

Complete the binary codec, clock estimator and bounded-queue simulator. Together they teach contracts, time and backpressure—the concepts most likely to produce difficult follow-up questions. Then trace a real Start/Stop path through the app.
