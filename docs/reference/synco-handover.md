# Synco — Project Handover & Architecture Specification (v2)

## 1. Overview
**Synco** is a cross-platform mobile app that plays the same audio in sync across multiple phones over a **local Wi-Fi / hotspot** network, with no internet or server required.

- **Host:** plays a local audio file and broadcasts it.
- **Guests:** join by scanning a QR code, receive the stream, and play it in sync with the host.
- **Fine-tuning:** a manual delay slider on each guest compensates for output latency (especially Bluetooth).

### Honest sync targets
- Target alignment: **±20–40 ms** between devices on wired/built-in speakers. This sounds tight to listeners.
- Phone audio output latency varies 20–200+ ms, and Bluetooth adds 100–300 ms. The manual slider is the primary fix for this, not clock sync.
- "Microsecond" or "<5 ms" accuracy is **not** a goal. Measure and display real numbers instead of promising them.

### Out of scope for MVP
- Re-broadcasting DRM-protected services (Spotify, YouTube Music, etc.). Impossible by design.
- Web (browser) guests, mDNS discovery, WebRTC, playlists/queue, stream URLs, seek, automatic Bluetooth latency detection, continuous playback-rate drift correction.

---

## 2. Tech Stack
- **Framework:** React Native + TypeScript. **Android-first**, iOS verified second (iOS background/network limits are stricter).
- **Transport (MVP):** plain WebSocket over TCP on the LAN. Host runs the server; guests connect as clients.
- **Join flow:** QR code carrying `{ ip, port, token, protocolVersion }`.
- **Audio codec:** Opus or AAC chunks (compressed), not raw PCM, unless the spike shows decoding is a problem.
- **Audio engine:** decided by the Day-1 spike (see Phase 0). Default candidate: `react-native-track-player` or a similar library; fallback: a small native module (Oboe on Android, AVAudioEngine on iOS) for scheduled playback.
- **State:** Zustand.
- **Testing:** Jest for pure TS packages; Node-based simulated host for integration.

---

## 3. Repository Structure

```
synco/
├── apps/
│   ├── mobile/                    # React Native host + guest app
│   │   └── src/
│   │       ├── ui/                # screens/components — NO network or audio logic
│   │       ├── state/             # Zustand stores: session, playback, sync
│   │       └── services/
│   │           ├── network/       # WebSocket server/client, transport interface
│   │           ├── sync/          # clock offset, drift handling, PLAY_AT scheduling
│   │           ├── audio/         # player adapter, jitter buffer
│   │           └── session/       # join/leave, token validation, QR payload
│   └── web-guest/                 # (v2, not in MVP) static browser guest
├── packages/
│   ├── protocol/                  # shared TS message types + schema + version
│   └── sync-core/                 # pure TS: offset estimation, drift logic (no native deps)
└── tools/
    └── sim-host/                  # Node script acting as a fake host for testing guests
```

**Rules**
1. UI never imports from `services/network` or `services/audio` directly; it goes through stores.
2. `services/network` exposes a **transport interface** (`connect`, `send`, `onMessage`, `close`) so WebSocket can be swapped for WebRTC later without touching sync logic.
3. `packages/sync-core` must stay pure TypeScript so it is unit-testable in Node with simulated latency.
4. All message shapes live in `packages/protocol`. No ad-hoc JSON elsewhere.

---

## 4. Protocol (v1)

All messages include `{ type, v }` where `v` is the protocol version.

| Message | Direction | Purpose |
|---|---|---|
| `HELLO { token, deviceName }` | guest → host | Join request |
| `WELCOME { sessionId, trackMeta, hostTime }` | host → guest | Accept + initial state |
| `PING { t0 }` | guest → host | Clock probe |
| `PONG { t0, t1, t2 }` | host → guest | `t1` = host receive time, `t2` = host send time |
| `CHUNK { seq, codec, hostPlayTime, payload }` | host → guest | Audio data scheduled in host time |
| `STATE { status, positionMs, hostTimeAtPosition }` | host → guest | Play/pause/position snapshot |
| `PLAY_AT { hostTime, positionMs }` | host → guest | Synchronized start |
| `PAUSE { hostTime }` | host → guest | Synchronized pause |
| `BYE` | either | Graceful leave |

### Clock offset (guest side)
```
t3 = guest receive time of PONG
offset = ((t1 - t0) + (t2 - t3)) / 2
rtt    = (t3 - t0) - (t2 - t1)
```
- Send ~10 pings at join, then every 5–10 s.
- **Keep the lowest-RTT sample from the last ~8** and use its offset. Do not average; Wi-Fi jitter skews averages.
- Convert any host time to guest-local time with `hostTime - offset`.

### Playback scheduling
- Guest keeps a **jitter buffer** (start ~200–300 ms, tune from measurements).
- On `PLAY_AT`, guest schedules start at `hostTime - offset + userDelayMs`.
- `userDelayMs` is the manual slider value (default 0, range ±200 ms), persisted per device.

### Drift handling (MVP)
- Periodically compare actual playback position with expected position from `STATE` + offset.
- If drift > **40 ms**, re-schedule/resync (small seek). Do not use continuous rate warping in MVP.
- Surface drift state in the UI (see §6).

---

## 5. Phases

### Phase 0 — Sync spike (do this first, before any real UI)
- [ ] Two Android phones on one hotspot.
- [ ] Hardcoded WebSocket host + guest, a click-track file.
- [ ] Implement ping/pong offset and `PLAY_AT` only.
- [ ] Record the real audible/measured offset between devices (e.g., record both speakers with a third device and inspect the waveform).
- [ ] **Decision gate:** if error ≲ 40 ms, proceed with the chosen library. If > ~100 ms, build the native scheduled-playback module before continuing.

### Phase 1 — Core networking & streaming
- [ ] Host: start WebSocket server, create session token, generate QR payload.
- [ ] Guest: scan QR, connect, authenticate token, receive `WELCOME`.
- [ ] Host: load a local audio file, encode/chunk, send `CHUNK` stream to 1+ guests.
- [ ] Guest: buffer and play chunks (not yet sync-accurate).
- [ ] `tools/sim-host` working for guest development.

### Phase 2 — Sync & calibration
- [ ] `sync-core`: offset estimator with unit tests (symmetric delay, asymmetric delay, jitter spikes, packet loss).
- [ ] Synchronized `PLAY_AT` / `PAUSE`.
- [ ] Jitter buffer + drift threshold resync.
- [ ] Manual delay slider (±200 ms) with persistence.
- [ ] Debug screen: live RTT, offset, drift, buffer depth.

### Phase 3 — Hardening
- [ ] Auto-reconnect with buffer catch-up (rejoin using session token, re-sync clock before resuming).
- [ ] Clear UI indicator when a guest is drifting or out of sync.
- [ ] Android foreground service / iOS background-audio configuration so playback survives screen lock.
- [ ] Host handles guest join/leave without interrupting others.

### v2 (post-MVP backlog)
- Zero-install **web guest** (browser needs a user tap to start audio; hosting a web bundle from the phone needs an embedded HTTP server).
- mDNS/Zeroconf discovery.
- Stream URLs (direct audio files only), playlist/queue, seek.
- WebRTC transport.
- Playback-rate drift correction.
- Auto Bluetooth latency estimation.

---

## 6. Instructions for the Coding Agent

1. **Decoupling:** follow the structure and rules in §3 strictly. Network, sync, audio, and UI must not leak into each other.
2. **Error handling:** handle network drops gracefully (auto-reconnect, re-sync clock, catch up buffer). Show clear UI states: *Connected*, *Syncing*, *Drifting*, *Disconnected*.
3. **Performance:** keep the UI thread responsive during continuous chunk processing (do chunk handling off the UI path).
4. **Metrics over promises:** log RTT, offset, and drift; expose them in a debug screen. There is no hard "<20 ms network latency" requirement — measure and report it.
5. **Testing:** `packages/sync-core` requires unit tests with simulated jitter and asymmetric delays. Protocol messages must be validated against the shared schema.
6. **Platform order:** build and verify on Android first, then iOS.
7. **Don't build** anything listed under "Out of scope for MVP" or the v2 backlog unless explicitly asked.
