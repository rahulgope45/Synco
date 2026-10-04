# Architecture decisions

## Adopted for the starter

- React Native + strict TypeScript, Android first, as requested.
- npm workspaces keep protocol and sync calculations independent of mobile code.
- Expo development builds provide a path to local native modules. Expo Go cannot validate the intended native host/audio stack.
- Zustand owns UI state; Zod validates incoming control messages; Jest checks pure TS.
- No database, login, backend, analytics, or cloud dependency in the MVP.
- Skills are original project-local instructions, not downloads of similarly named community packages.

## Deferred until measured

- Audio engine: evaluate scheduled playback and streaming support before choosing a library. Track-player is a candidate from the handover, not a confirmed solution.
- Phone-host WebSocket server needs a native-compatible implementation; React Native's client API alone is insufficient.
- Codec, chunk framing, sample rate, sequence discontinuities, and maximum buffer sizes require a streaming spike. Protocol implementation currently covers Phase 0 only.
- Use a monotonic clock and establish how JS/native audio clocks map. Never schedule using Date.now across devices.
- The +/-200 ms calibration range may not cover some Bluetooth paths. Negative compensation needs sufficient prebuffer and future start lead time; data cannot play before arrival.
- Plain LAN WebSocket is unencrypted. A join token restricts admission but provides no confidentiality. Do not log tokens; bind to the intended LAN and cap connections/message sizes when implementing transport.

Sources: [Expo native customization](https://docs.expo.dev/workflow/customizing/), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Codex skills](https://learn.chatgpt.com/docs/build-skills).
