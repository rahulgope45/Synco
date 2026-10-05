# Native binary audio validation

Implementation date: 2026-10-05. This is a test record, not a measured improvement claim.

## Software evidence
- Wire v2: 32-byte header, 1920-byte PCM, 1952-byte fixed packet. TS validates valid/truncated/oversized/wrong-format packets; generated Kotlin codec checked for drift.
- `npm run check`: typecheck, lint, wire-generation check and 23 tests passed after the migration.
- Final Kotlin module and arm64 debug APK built offline. A prior matching debug build was installed on RMX3085 and V2146 while both were available. The exact standalone release APK was installed on RMX3085 and cold-launched without Metro or ADB reverse.
- RMX3085 host control smoke passed: wrong token, unauthenticated probe and malformed text rejected; two simulated guests became ready, received identical `PLAY_AT`, and one departure did not interrupt the other.
- RMX3085 native audio smoke passed: one simulated admitted listener received 100 valid binary PCM packets (1952 bytes each). All 100 payloads were silent because the music source was not playing. This verifies host capture-to-native-socket framing, not guest AudioTrack or audible delay.
- Prior base64 APK remains at ignored `dist/synco-0.1.0-arm64-test.apk` for comparison.
- Standalone native release APK built offline at ignored `dist/synco-0.1.0-native-arm64-test.apk`; bundled JS, ARM64 ABI, package and v2 signature verified. SHA-256: `41ecdc56de726626d97d954933a0c398a2374f3d9992e18690ce5e58b0af2493`. Exact APK cold-launched on RMX3085 without Metro.

## One-phone standalone release check — 2026-10-05
- ReVanced Music media session reported playing. RMX3085 hosted from the installed standalone release APK. A simulated listener authenticated using wire v2 and became ready.
- First music capture: 100 validated 1952-byte binary packets, 184,605 nonzero payload bytes. Subsequent run received 830 validated packets, 1,569,270 nonzero bytes, epoch 2062819367; `AUDIO_STOP` arrived and Android no longer listed the capture service.
- Restarted capture under the same host session with fresh consent: 853 validated packets, 1,614,837 nonzero bytes, epoch 1482994417. Epoch changed; `AUDIO_STOP` arrived; capture service stopped.
- Standalone host control smoke passed after retrying an intermittent empty Android UI dump: wrong token, unauthenticated probe and malformed data rejected; two simulated guests received identical scheduled `PLAY_AT`; one guest leaving did not interrupt the other.
- Synco host session was ended after testing. Tests counted nonzero bytes and inspected headers only; no PCM or music recording was saved.
- These checks validate source capture, native host framing, admission, Stop and restart. They do **not** validate native guest AudioTrack, audible delay, synchronization, route behavior or sustained playback on a second phone.

## Physical test matrix — pending
| Run | Build | Host/source | Listener/route | Network | Onset p50/p95/max | Dropouts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline | base64 APK | RMX3085/ReVanced | V2146/speaker | router Wi-Fi | pending | pending | User previously reported continuous but delayed |
| Native | wire v2 APK | RMX3085/ReVanced | V2146/speaker | same router | pending | pending | Wi-Fi became unavailable before two-phone stream test |
| Native | wire v2 APK | RMX3085/ReVanced | V2146/earphones | same router | pending | pending | Route-specific |
| Native | wire v2 APK | RMX3085/ReVanced | V2146/speaker | host hotspot | pending | pending | Compare only with same route |

Capture at least 20 identifiable onsets on one recording timebase, plus five minutes continuous playback. Report signed and absolute source-to-listener delay, p50/p95/max, drift and dropouts separately. Do not save copyrighted music recordings without user authorization. Record native received/missing/discarded, queue/overflow, AudioTrack underruns and host send drops. Then test consent denial, Stop, capture restart epoch, guest disconnect and post-stream click regression.

The earlier ADB connection dropped while host capture was running. On reconnection, the service was found still active and was stopped with `am force-stop` before installing the standalone APK. The later release-run Stop actions were confirmed by `dumpsys activity services`.
