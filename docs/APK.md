# Standalone Android test APK

The ARM64 APK bundles JavaScript and assets and does not need Expo Go or Metro. It targets the two physical ARM64 phones used for Synco testing. It is a release variant signed with the existing development/test key, for sideload testing rather than Play Store publication.

From `apps/mobile`, regenerate native configuration:

```powershell
npx expo prebuild --platform android --no-install
```

From `apps/mobile/android`, build:

```powershell
$env:Path='C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;' + $env:Path
$env:NODE_ENV='production'
.\gradlew.bat app:assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
```

Output: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.
Delivery copy: `dist/synco-0.1.0-arm64-test.apk`. Build artifacts stay outside Git.

`apps/mobile/plugins/with-lan-network.js` persists the cleartext-network setting required for the current local `ws://` transport across prebuilds. Join codes still validate private LAN IP addresses. A token controls admission; the audio connection is not encrypted.

Baseline APK functionality and limits: `LIVE-MUSIC.md`. The previous ReVanced Music stream was delayed and not synchronized with source playback. Guest use does not need the source music app installed; host capture needs Android 10+ and the selected source app.

## Native binary audio test artifact — 2026-10-05

- File: `dist/synco-0.1.0-native-arm64-test.apk` (kept separate from the base64 baseline below).
- Size: 36,792,573 bytes. SHA-256: `41ecdc56de726626d97d954933a0c398a2374f3d9992e18690ce5e58b0af2493`.
- Built offline with `NODE_ENV=production`, `EXPO_OFFLINE=1`, `app:assembleRelease -PreactNativeArchitectures=arm64-v8a --offline`.
- Contains `assets/index.android.bundle` and ARM64 native libraries; package `com.synco.app`, version `0.1.0`. APK v2 signature verified with the existing development/test key.
- The exact release APK was installed and cold-launched on RMX3085 without Metro or ADB reverse. Non-silent native capture, binary packet delivery to a simulated listener, Stop and stream restart passed. Guest playback and audible latency still need the second phone. See `docs/validation/native-audio-2026-10-05.md`.

## Verified artifact — 2026-10-04

- File: dist/synco-0.1.0-arm64-test.apk
- Size: 36,772,113 bytes (35.1 MiB).
- SHA-256: 7970314d33e1764f89eda716c2cbe9e9d11f88e4087ae8f00c782036ace61f36
- Gradle assembleRelease including lintVitalRelease passed; 584 tasks, 5m 37s.
- APK v2 signature verified; package com.synco.app 0.1.0, ARM64, bundled JavaScript present.
- Release manifest includes usesCleartextTraffic=true for the LAN transport.
- Installed on V2146 and cold-launched the Synco screen after removing its Metro ADB reverse. No development-server URL was opened.
- Typecheck, ESLint and all 20 tests passed. This launch check does not remeasure music latency.
