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

Current functionality and limits: `LIVE-MUSIC.md`. Live ReVanced Music sharing remains delayed and is not synchronized with source playback. The Android APK supports guest use without the source music app installed; capture is available only on Android 10+ with the selected source app installed.

## Verified artifact — 2026-10-04

- File: dist/synco-0.1.0-arm64-test.apk
- Size: 36,772,113 bytes (35.1 MiB).
- SHA-256: 7970314d33e1764f89eda716c2cbe9e9d11f88e4087ae8f00c782036ace61f36
- Gradle assembleRelease including lintVitalRelease passed; 584 tasks, 5m 37s.
- APK v2 signature verified; package com.synco.app 0.1.0, ARM64, bundled JavaScript present.
- Release manifest includes usesCleartextTraffic=true for the LAN transport.
- Installed on V2146 and cold-launched the Synco screen after removing its Metro ADB reverse. No development-server URL was opened.
- Typecheck, ESLint and all 20 tests passed. This launch check does not remeasure music latency.
