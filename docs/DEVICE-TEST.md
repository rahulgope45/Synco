# First Android device test

This slice provides native scheduled click playback and a computer-host clock simulator.
It does not complete the two-phone hotspot measurement gate.

## Start a development session

From the repo root, run `npm start` (Metro) and `npm run sim-host` in separate terminals.
For an ADB-only Windows session, use `$env:REACT_NATIVE_PACKAGER_HOSTNAME="127.0.0.1"` then `npm start -- --host lan`.
Avoid `--localhost` here: Node may bind only IPv6 while ADB forwards to IPv4.
Forward ports to the device currently listed by `adb devices`:

```powershell
adb -s DEVICE_SERIAL reverse tcp:8081 tcp:8081
adb -s DEVICE_SERIAL reverse tcp:8787 tcp:8787
```

For local native compilation: `npm run android -- --device RMX3085`.
Expo selects this wireless device by model name, while adb uses its IP:port serial.
The native project is generated; customize it through app config/plugins.
The audio package's Windows build requires Git Bash.

Open the Synco development app, using the Metro development server at http://127.0.0.1:8081.
Expo Go does not contain the custom audio module.

## Controls

- Play 8 clicks: schedule a quiet, eight-second generated click track two seconds ahead on the native audio clock.
- Stop clicks: cancel the current track.
- Connect test host: collect clock probes through the ADB-forwarded WebSocket.
- After Clock ready appears, press Enter in the simulator terminal to schedule a future start.
- Disconnect test host: stop and reset the session.

Keep the app foregrounded. Backgrounding closes audio/network for this spike.
Clock ready means at least three recent matched replies, not acoustic synchronization.
RTT and offset are for the computer-to-device ADB path. No audible error is measured automatically.

Next: phone-host transport, two-device acoustic measurements, then streaming/file selection.
