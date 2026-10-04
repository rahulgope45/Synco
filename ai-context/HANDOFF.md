# Resume Synco

Stage: Phase 0 started; first physical-device slice works.
Device: RMX3085 / Android 13, wireless ADB. Recheck adb devices before using the serial.
Implemented: native scheduled click track, guest WebSocket, probe freshness/correlation, computer simulator, test UI.
Verified: native build/install/launch; user heard local clicks; simulator PLAY_AT completed; background disconnect.
Checks: typecheck, lint, 15 tests and simulator smoke passed.
Evidence: docs/validation/device-smoke-2026-10-04.md; docs/DEVICE-TEST.md.
Next: phone-host LAN WebSocket server/token admission, then second-phone acoustic comparison.
Read: features/network.md, audio.md, sync.md; docs/PHASE-0.md.
Audio candidate: react-native-audio-api 0.13.6; final choice awaits measured two-device results.
Limits: ADB-path RTT is not hotspot latency or audible alignment. No file streaming or background playback yet.
Development servers: Metro port 8081, simulator loopback port 8787; verify processes before restarting.
Existing dependency advisories remain documented; no forced downgrade applied.
