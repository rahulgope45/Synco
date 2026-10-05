# 4. How to start and demonstrate Synco

Choose the **standalone APK** for a demo. Choose a **development build + Metro** when changing code. Expo Go is insufficient because Synco includes custom native modules.

Commands below use Windows PowerShell and the existing workspace. Replace device placeholders with current values; wireless-debugging ports can change.

## A. Run the existing standalone APK

Prerequisites: an ARM64 Android phone, ADB installed and connected, and the local APK artifact. Host playback capture requires Android 10 or later. The APK is an ignored build artifact and will not appear in a fresh Git clone.

```powershell
Set-Location E:\Projects\Synco
adb devices
$serial = 'CURRENT_DEVICE_IP:PORT'
Test-Path .\dist\synco-0.1.0-native-arm64-test.apk
adb -s $serial push .\dist\synco-0.1.0-native-arm64-test.apk /data/local/tmp/synco-native.apk
adb -s $serial shell pm install -r /data/local/tmp/synco-native.apk
adb -s $serial shell rm -f /data/local/tmp/synco-native.apk
adb -s $serial shell monkey -p com.synco.app 1
```

Check each command's result before continuing. The `rm` command removes only the temporary APK copy, not application data. If installing on two phones, repeat with each current serial. Both must use this native-wire build; do not mix it with the older Base64 APK.

No Metro, Expo Go or source music app is required on a listener. The selected source app must be installed on the host. Wireless debugging is a development convenience, not a runtime requirement for phone-to-phone streaming.

See [APK details and checksum](../APK.md) for artifact verification.

## B. Start a phone-to-phone session

1. Put both phones on a local network that allows peer connections. Hotspot is an option to test.
2. Open Synco on the host, find Wi-Fi addresses and host on the address reachable from the guest.
3. Copy the join code to the guest and join. Wait until the guest is ready.
4. On the host, choose **Share music app audio** and approve Android capture consent.
5. Open the selected ReVanced Music app on the host and play a song.
6. Keep Synco foregrounded on the guest. Check its output route and media volume.
7. Finish with **Stop music sharing**, then end/leave the session.

The music app owns play/pause/track selection. Synco does not add those controls. The redesigned physical guest playback is still pending verification, so use this as a test procedure rather than a guaranteed demo result.

## C. Prepare development tools

Install a Node version satisfying the root `package.json` requirement, Android SDK/build tools, a compatible JDK and Git for Windows. Existing documentation recommends the locally working toolchain; do not upgrade dependencies immediately before an interview demo.

```powershell
Set-Location E:\Projects\Synco
node --version
npm ci
npm run check
$env:Path = 'C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;' + $env:Path
npm run android -- --device RMX3085
```

Replace the model name if using a different phone. Expo's device selection can use the model name; `adb -s` uses the exact device serial. `npm ci` needs cached packages or network access. Installing tools/dependencies is separate from Synco's offline runtime design.

Rebuild the native app after Kotlin/native configuration changes. A Metro refresh can apply ordinary JS/TS changes but cannot add new native code to an installed binary.

## D. Run Metro with ADB forwarding

In one PowerShell terminal:

```powershell
Set-Location E:\Projects\Synco\apps\mobile
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1'
npx expo start --dev-client --host lan --port 8081
```

In another terminal:

```powershell
$serial = 'CURRENT_DEVICE_IP:PORT'
adb -s $serial reverse tcp:8081 tcp:8081
adb -s $serial shell am start -a android.intent.action.VIEW -d 'exp+synco://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081' com.synco.app
```

If tooling is already cached and Expo's online lookup is unavailable, set `$env:EXPO_OFFLINE = '1'` before starting. This does not install missing dependencies or restore a lost wireless ADB connection. A USB connection can provide an alternative debugging link.

The loopback URL works because ADB forwards it to the computer. It is not the address a second phone should use to join a phone-host music session.

## E. Run the one-phone clock experiment

Start the simulator in a separate terminal:

```powershell
Set-Location E:\Projects\Synco
npm run sim-host
```

Forward its port using the connected device serial:

```powershell
adb -s $serial reverse tcp:8787 tcp:8787
```

In Synco, use **Play 8 clicks** for local audio, or **Connect test host** for probes. When clock readiness appears, press Enter in the simulator terminal to schedule the click test. This tests clock/control behavior over the debugging path; it does not establish phone-to-phone music latency.

## F. Rebuild the standalone test APK

From `apps/mobile`, regenerate Android configuration through Expo:

```powershell
Set-Location E:\Projects\Synco\apps\mobile
npx expo prebuild --platform android --no-install
Set-Location .\android
$env:Path = 'C:\Program Files\Git\bin;C:\Program Files\Git\usr\bin;' + $env:Path
$env:NODE_ENV = 'production'
.\gradlew.bat app:assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
```

Use `--offline` only when Gradle dependencies are already cached. Output is `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`. Follow [APK documentation](../APK.md) when creating a named delivery copy. Native configuration belongs in Expo config/plugins; manual edits to generated Android configuration may disappear on prebuild.

This build uses the current test signing setup. Store publication needs a separate release process.

## Troubleshooting before a demo

| Symptom | Check first |
| --- | --- |
| ADB shows no phone | Current pairing/connection, debugging enabled, USB alternative |
| Development app cannot load JS | Metro running, correct port, `adb reverse`, development build installed |
| Native module missing | Expo Go/wrong build; rebuild and install native app |
| Guest cannot join | Same reachable LAN, correct host IP/token, matching wire build, firewall/isolation |
| Share button disabled | Host mode and at least one ready guest |
| Silence | Source playing, consent, selected source UID, volume and audio route |
| Continuous but late | Record delay and queue/route data; don't assume packet loss |
| Guest stops after switching apps | Current receiver foreground-only limitation |
| Source still capturing after ADB loss | Reconnect and use Stop; debugger loss does not stop the service |

Never promise a two-phone demo while the second device is unavailable. Show the standalone launch, local clicks, protocol tests and recorded host evidence instead, with that limitation stated.
