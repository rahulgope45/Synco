# Two physical phones — 2026-10-04

Host: RMX3085, Android 13. Guest: V2146, Android 13, arm64-v8a.
Same Wi-Fi LAN; native phone WebSocket on port 8788. ADB reverse serves the development bundle only.
Installed the existing Synco development APK on the guest; Expo Go is not required.

- Physical guest authenticated and reached clock-ready; host showed 1 joined / 1 clock-ready.
- Both phones reported Finished 8 clicks after a host-issued group start.
- User listening result: “Both audible, one beat.” This is subjective evidence, not a measured millisecond result.
- Repeated automated two-phone smoke passed. Initial single completion snapshot was too early; subsequent inspection showed both complete. Smoke now polls with a bounded timeout.
- Typecheck, lint and all 19 unit tests passed.

Reproduce with both apps open at the top of the screen:
`node --experimental-strip-types tools/device-smoke/two-phones.ts HOST_ADB_SERIAL GUEST_ADB_SERIAL`
The script transfers the join code in memory and removes temporary UI XML. It leaves the session open for listening repeats.

Still pending: recorded repeated-start error distribution, five-minute sustained drift, dropouts and route comparisons. No acoustic <=40 ms gate claimed. Both phones synthesize the click track; music-file streaming is not implemented.
