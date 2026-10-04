# Native audio delivery plan

Updated: 2026-10-04. Direction accepted by user; implementation has not started.

## Scope and success

Synco connects a host and listeners and shares the host's existing music-app output. The source app owns song selection, playlists and playback controls. Synco owns connection, capture consent, streaming and Stop/Leave. Do not add a music player, local-file library, accounts or backend. The click test remains an engineering diagnostic.

Success means lower measured source-to-listener audible delay with continuous playback, followed by measured alignment between multiple receivers. These are separate metrics. No zero-latency promise or universal headphone/app compatibility claim.

## Current baseline

- Working path: native AudioRecord -> base64 event -> host JS validation/JSON -> native WS -> guest JS validation -> native base64 decode -> AudioTrack.
- 48 kHz mono PCM16 little-endian, 960 samples / 20 ms per frame. Approximately 128 KB/s per listener before JSON/WS overhead.
- Startup cushion: 100 ms. Receiver queue capacity: 300 ms. AudioTrack capacity: at least 100 ms. Capture capacity: at least 200 ms. Capacities are not measured latency; do not add them as if every buffer were full.
- Sender drops live frames above 16 KiB queued; control sends reject slow peers above 64 KiB. Connection cap: eight, not eight physically verified listeners.
- ReVanced Music 8.10.52 capture verified on RMX3085; V2146 listener confirmed continuous but delayed. Zero missing frames observed over 80 seconds is not proof of no output underruns.
- Stop propagation and the post-stream shared-click regression passed. Twenty tests, typecheck/lint and native build passed before this planning turn.
- No acoustic latency distribution, headphone calibration, live drift correction or native binary transport exists. Official YouTube Music and Spotify are not targeted/tested.

## Target architecture

Audio: Android playback capture -> native binary encoder -> native WebSocket -> native validated receiver -> bounded native buffer -> native output.

Control: React Native UI -> Zustand -> session services/shared protocol -> native session commands. JS receives low-rate state/metrics, never PCM, base64 or per-frame audio events.

Keep WebSocket, mono PCM and AudioTrack initially. Change one major factor at a time. Oboe/AAudio, UDP, WebRTC and compression are later evidence-driven experiments, not migration prerequisites.

Proposed connection arrangement: one native-owned WS per guest; binary audio stays native, text controls go to TS for existing admission/validation. TS authorizes native audio only after a valid handshake. Native immediately removes authorization on socket close/session replacement. Bind authorization to the actual socket and stream epoch, not a reusable guest ID alone.

## Phase A — baseline and instrumentation

Deliver aggregate capture/read/send/receive/output metrics: frame counts, queue duration, socket backlog, gaps/discards, output underruns and route changes. Avoid per-frame UI updates or audio logs. Use monotonic clocks; document JS/native and cross-device clock mappings before comparing timestamps.

Record build, devices/OS, source version, network and output routes. Collect at least twenty identifiable onsets and a five-minute continuous run using a common recording timebase. Report signed/absolute p50/p95/max audible error, drift and dropouts separately from RTT. Start with speakers/wired output, then actual Bluetooth earphones.

Exit: reproducible baseline and results template. Missing recording equipment blocks acoustic claims, not independent software instrumentation/contract work.

## Phase B — binary contract and compatibility

Define the wire contract under packages/protocol: version, stream epoch/ID, sequence, sample position or timestamp with an explicit clock domain, format, frame count, payload length and byte order. Bound and validate all lengths before allocating. Include capability negotiation, stream start/stop and reconnect resets. Clearly reject unsupported peers; preserve the existing APK for comparison.

Honor the repository's shared protocol ownership rule: generate native Kotlin codecs/runtime validators from packages/protocol and maintain shared valid/invalid binary fixtures plus a generation-drift check. Do not hand-maintain divergent schemas or send PCM through JS just for validation. Exact header layout is an implementation decision, not finalized here.

Separate text-control limits from binary-audio limits; the current native server rejects binary data and assumes a 4 KiB control maximum. Preserve authentication and guest limits. Test truncated/oversized packets, invalid lengths/version/format, stale epochs, duplicate/out-of-order sequence, audio before admission and guest attempts to inject host audio.

Exit: TS/native fixture interoperability and meaningful negative tests pass.

## Phase C — complete native audio delivery

Host: connect AudioRecord directly to a bounded native network worker using reusable buffers. Do not block capture/output callbacks on network operations. Guest: native WS client validates binary frames and supplies the native audio queue directly.

Bridge only commands, admission updates, errors/stop and aggregate metrics. Remove onPcm/playFrame per-frame JS traffic from the new mode. Migrating only the sender is not completion. Isolate slow guests; ignore stale callbacks after reconnect; revoke native permissions immediately on disconnect.

Preserve UID filtering, per-session capture consent, foreground notification, permission revocation and Stop. No microphone source, screen capture, source-app modification or saved audio. Keep baseline packet format, buffer targets and transport for the first A/B run.

Exit: two phones play continuously; traces/code confirm no PCM crossing JS; stop/revoke/disconnect and click regressions pass; latency/CPU/backlog compared to Phase A. Native code alone is not proof of improvement.

## Phase D — tune latency against measured bottlenecks

Compare startup targets of 40/60/100 ms, then negotiated 10/20 ms packets. Tune actual queue occupancy and output buffer usage separately; distinguish startup waiting from steady-state latency. Bound queued audio age so a reliable connection cannot replay an old backlog indefinitely.

Use underrun evidence to increase buffers when needed and reduce cautiously after stable periods. Evaluate controlled discontinuity recovery instead of repeated whole-queue clearing. Test low-latency AudioTrack configuration; benchmark Oboe/AAudio separately only if output remains a dominant measured cost.

Compare router Wi-Fi and host-provided hotspot using the same devices, then the intended earphones. Do not attribute Bluetooth/output latency to the network without evidence.

Exit: documented p50/p95/max improvement and dropout counts versus baseline under matching conditions. Select the lowest stable setting. <=40 ms audible offset is a proposed experimental goal for a named route, not a guarantee. If missed, identify the dominant remaining stage rather than immediately switching transports.

## Phase E — align receivers and control drift

Schedule receivers on a shared stream timeline using native clock mapping and output-position tracking. Account for measured route-specific output delay where available. Reset/re-evaluate on route changes. Maintain target buffer occupancy using small controlled rate correction or another measured resynchronization method. Late joins catch up to the current epoch; stream restarts cannot replay stale audio.

Exit: one host plus two physical listeners and a slow simulated listener tested; recorded receiver-to-receiver onset/drift results over sustained playback. One departing/slow guest must not interrupt others.

Source-to-receiver error remains separate. Android capture does not let Synco delay the original music app. Host earphone alignment is unresolved; do not claim it is solved by clock sync or buffering guests. A source output route might incidentally offset transmission delay, but that must be measured, not assumed.

## Phase F — reliable listening and standalone APK

Add background listener playback with appropriate native service/audio-focus lifecycle. Test lock/unlock, interruptions, route changes, consent denial/revocation, host exit and network loss. Reconnect with fresh admission/epoch and bounded queues. Surface native output failures instead of silent errors/unbounded retries.

Build standalone APK, verify signature/embedded bundle, cold-launch without Metro and run the actual APK's device matrix. Record checksum and signing scope.

Exit: validation report, known limitations, reproducible artifact and compact handoff. QR/UI polish, other source apps, iOS and internet streaming remain separate follow-up scope.

## Checkpoints and first implementation slice

Run npm run check after code changes and relevant native codec/lifecycle tests/builds. Preserve authentication and click diagnostics. Record hardware results separately. Never commit audio, credentials or join tokens; obtain user authorization before saving recordings of their music.

Each phase ends with a coherent tested local commit and feature-context update. Do not push. First slice: Phase A telemetry/result template plus Phase B contract/fixtures. Do not rewrite transport before contract and admission/lifecycle boundaries are explicit. If Phase C produces little improvement, use its measurements to prioritize output/buffer work.

References: [Android capture](https://developer.android.com/media/platform/av-capture), [Android low-latency audio](https://developer.android.com/games/sdk/oboe/low-latency-audio).
