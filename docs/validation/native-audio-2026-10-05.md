# Native binary audio validation

Implementation date: 2026-10-05. This is a test record, not a measured improvement claim.

## Software evidence
- Wire v2: 32-byte header, 1920-byte PCM, 1952-byte fixed packet. TS validates valid/truncated/oversized/wrong-format packets; generated Kotlin codec checked for drift.
- `npm run check`: typecheck, lint, wire-generation check and 23 tests passed after the migration.
- Final Kotlin module and arm64 debug APK built offline. A prior matching debug build was installed on RMX3085 and V2146 while both were available; final lifecycle fixes were built but not installed after Wi-Fi went down.
- RMX3085 host control smoke passed: wrong token, unauthenticated probe and malformed text rejected; two simulated guests became ready, received identical `PLAY_AT`, and one departure did not interrupt the other.
- RMX3085 native audio smoke passed: one simulated admitted listener received 100 valid binary PCM packets (1952 bytes each). All 100 payloads were silent because the music source was not playing. This verifies host capture-to-native-socket framing, not guest AudioTrack or audible delay.
- Prior base64 APK remains at ignored `dist/synco-0.1.0-arm64-test.apk` for comparison.
- Standalone native release APK built offline at ignored `dist/synco-0.1.0-native-arm64-test.apk`; bundled JS, ARM64 ABI, package and v2 signature verified. SHA-256: `41ecdc56de726626d97d954933a0c398a2374f3d9992e18690ce5e58b0af2493`. Exact APK cold launch is pending.

## Physical test matrix — pending
| Run | Build | Host/source | Listener/route | Network | Onset p50/p95/max | Dropouts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline | base64 APK | RMX3085/ReVanced | V2146/speaker | router Wi-Fi | pending | pending | User previously reported continuous but delayed |
| Native | wire v2 APK | RMX3085/ReVanced | V2146/speaker | same router | pending | pending | Wi-Fi became unavailable before two-phone stream test |
| Native | wire v2 APK | RMX3085/ReVanced | V2146/earphones | same router | pending | pending | Route-specific |
| Native | wire v2 APK | RMX3085/ReVanced | V2146/speaker | host hotspot | pending | pending | Compare only with same route |

Capture at least 20 identifiable onsets on one recording timebase, plus five minutes continuous playback. Report signed and absolute source-to-listener delay, p50/p95/max, drift and dropouts separately. Do not save copyrighted music recordings without user authorization. Record native received/missing/discarded, queue/overflow, AudioTrack underruns and host send drops. Then test consent denial, Stop, capture restart epoch, guest disconnect and post-stream click regression.

The ADB connection dropped while host capture was running. The user was asked to tap **Stop** in the first phone's Synco notification if it remained active; remote stop could not be confirmed. No audio data was saved by the smoke tool.
