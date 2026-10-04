# Phone networking checkpoint - 2026-10-04

Device: RMX3085 / Android 13. Phone-host module: Expo Modules Kotlin + Java-WebSocket 1.6.0.
Native build/install succeeded after adding required module version metadata and Git Bash utilities to PATH.

Verified over local Wi-Fi (no ADB socket forwarding for these control connections):
- Host bound to selected phone LAN address and displayed a fresh join code.
- Wrong token, pre-authentication PING, and malformed JSON were rejected with close code 1008.
- Two simulated guests authenticated; host displayed 2 joined / 2 clock-ready.
- Both guests received identical PLAY_AT messages from the phone's group-play action.
- One guest leaving did not interrupt probes from the remaining guest.
- The phone joined a temporary token-protected computer host, became clock-ready, and completed eight scheduled clicks.
- Leaving the phone session closed the guest socket.
- npm run check passed: TypeScript (app, packages, tools), ESLint, and 19 tests in four suites.

Not yet verified: two physical phone speakers aligned acoustically, hotspot client isolation behavior, eight-device load, sustained playback, background playback, or iOS. Music file streaming and QR scanning are unimplemented.
Reproducible scripts: tools/device-smoke/phone-host.ts and phone-guest.ts. No session tokens are saved in this evidence.
