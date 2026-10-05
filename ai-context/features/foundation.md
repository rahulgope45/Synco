# Foundation

Updated: 2026-10-05.

## Status
React Native/strict TS Android project. Native binary-audio standalone ARM64 test APK built offline; exact release artifact has not been device-launched.

## Paths
`apps/mobile`, root `package.json`, `docs/APK.md`, `dist/` (ignored artifacts), `skills/`.

## Decisions
Expo development builds for iteration; npm workspaces; test-key signed release APK for sideload testing. No public signing or store release yet. Original repo-local skills and compact feature context remain in use.

## Evidence
`npm run check` passes: typecheck, lint, wire-generation check, 23 Jest tests. Final arm64 debug and release builds pass offline. Native release APK at `dist/synco-0.1.0-native-arm64-test.apk` contains JS bundle and ARM64 native libraries; package identity, v2 signature and SHA-256 verified in `docs/APK.md`.
Prior base64 APK at `dist/synco-0.1.0-arm64-test.apk` was cold-launched on V2146 without Metro on 2026-10-04. Current native release APK cold launch and two-phone audio remain pending after Wi-Fi failure.

## Risks and next action
Install the native standalone APK on both phones when ADB/Wi-Fi returns. Validate cold launch, audio capture/receiver and acoustic delay; keep the base64 APK as comparison. Production signing and dependency review remain before public release. See `docs/validation/native-audio-2026-10-05.md`.
