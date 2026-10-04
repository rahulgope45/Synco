# Physical Android smoke test - 2026-10-04

Device: RMX3085, Android 13, wireless ADB.
Build: Expo SDK 57, React Native 0.86.3, react-native-audio-api 0.13.6.

## Confirmed

- Native debug build succeeded (330 tasks; initial build 8m 42s), installed, and opened.
- Metro served the app after changing from IPv6-only localhost to IPv4-compatible binding.
- Local native click schedule accepted with about 1,985-1,991 ms lead time.
- First listen was reported silent. A repeat was explicitly confirmed audible by the user. The exact reason for the first silent report is not established; media volume was unmuted and speaker routing active at the follow-up check.
- Native completion callback displayed Finished 8 clicks.
- Computer simulator connection reached Clock ready; observed RTT 19.9-20.7 ms via wireless ADB forwarding (not a LAN transport benchmark).
- Simulator PLAY_AT scheduled on phone with 2,929 ms remaining lead and completed eight clicks.
- Backgrounding disconnected the guest; returning showed cleared clock metrics and Disconnected.
- Simulator smoke checked matching PONG and malformed-message close code 1008.
- Typecheck, ESLint and 15 Jest tests passed; tools are included in typechecking/linting.

## Not established

No two-phone audible alignment measurement, phone-host server, hotspot transport benchmark, file streaming, drift correction, Bluetooth calibration, background playback, or iOS verification.
The large signed clock offset is normal for clocks with different origins; it is not audio drift or playback latency.
The audio engine remains a candidate until the two-device acoustic gate passes.

See device-phase0.png for the verified on-device screen and ../DEVICE-TEST.md for repeatable steps.
