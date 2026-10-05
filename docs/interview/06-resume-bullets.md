# 6. Resume bullets you can defend

Use two or three bullets that match the role and your actual understanding. Synco is a prototype; do not present it as a shipped production service or claim measured latency gains that we have not established.

## Suggested project entry

**Synco — Android Local Audio-Sharing Prototype**

React Native · TypeScript · Kotlin · Expo · WebSocket · Zustand · Zod · Jest

- Developed an Android audio-sharing prototype with React Native, TypeScript and Kotlin, enabling a host to capture a selected music app's playback and stream it to admitted peers over a local network.
- Implemented a native binary audio pipeline using 20 ms PCM frames, versioned packet validation and bounded queues, removing Base64 conversion and per-frame JavaScript handoffs from the redesigned music path.
- Validated shared application logic with 23 Jest tests and verified standalone Android host capture, binary delivery to simulated listeners, and capture stop/restart behavior.

These statements describe the project work. If asked how it was built, explain the AI-assisted workflow accurately. Use them only after you can trace the relevant code and distinguish the completed host tests from pending physical guest validation.

## Alternatives by role

### React Native / TypeScript emphasis

- Structured a React Native application into UI, state, services and platform adapters, with reusable protocol and clock-estimation packages independent of the screen layer.
- Added runtime validation for session messages and lifecycle guards for stale callbacks, separating network input handling from typed UI state.

### Android / systems emphasis

- Integrated Android playback capture and AudioTrack through Kotlin modules, using a native streaming worker and bounded playback queues for live PCM audio.
- Defined a 32-byte binary audio header with stream epochs, sequence numbers and sample positions, with generated Kotlin support and TypeScript validation.

### Testing / engineering discipline emphasis

- Built simulated-peer checks for admission, readiness, malformed input and session departure, and maintained separate software, packaging and physical-device validation records.
- Created compact feature-specific context and reproducible device-test documentation to support iterative development and handoff.

## Numbers you may use

| Number | Exact meaning | What it does not mean |
| --- | --- | --- |
| 20 ms | Duration represented by each PCM frame | End-to-end latency |
| 48 kHz, mono, PCM16 | Current stream format | Stereo or universal high-fidelity support |
| 1,952 bytes | Current complete binary packet | Total network cost including TCP/IP |
| 23 tests | Jest tests in the recorded project check | 23 hardware/audio tests |
| Eight sockets | Current configured native host cap | Eight real listeners tested |
| Two simulated peers | Verified host control scenario | Redesigned two-phone audible playback |

Do not turn theoretical Base64 size savings into a measured performance percentage. Do not claim “zero latency,” “perfectly synchronized,” “works with all music apps,” “production secure,” or invented user counts.

## A good project-summary sentence

> Built an Android prototype for nearby shared listening, with native PCM streaming and a React Native control layer; currently validating receiver playback and measuring latency across devices.

## If an interviewer asks about AI

> I used AI as an implementation and debugging assistant. I set the product scope, ran device experiments and used the results to guide changes. I can walk through the protocol and streaming path, and I keep an explicit record of what we have and haven't validated.

Adapt this to your actual work. If you have not yet reviewed a module, say that and explain how you would inspect it. Completing the [rebuild exercises](07-rebuild-to-learn.md) makes these bullets much easier to defend.
