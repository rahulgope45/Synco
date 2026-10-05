# 5. Deep interview questions and answer guides

Practice answers aloud, then open the relevant source and defend them. These are answer guides, not a script to memorize. “Current” describes this snapshot; “next” is a proposal.

## Product and architecture

### 1. What does Synco actually do?

It shares the selected host app's captured audio with nearby joined phones over a local network. The goal is listening together with separate earphones. It does not own music selection or playback controls. The Android prototype exists; comfortable synchronized listening remains a measured acceptance goal.

**Follow-up:** Why not send a file? The selected source is another app's live playback, not a file exposed to Synco.

### 2. What is your architecture, and why these boundaries?

UI calls state/actions; state orchestrates services; services use shared logic and adapters. Protocol validation belongs in `packages/protocol`; pure timing logic belongs in `packages/sync-core`; native adapters own capture and playback. These boundaries let us test math and malformed messages without an Android device.

**Follow-up:** Where does a new wire field go? Into the protocol contract and its consumers, not an isolated UI type.

### 3. Why React Native if audio is native?

React Native handles the UI and application workflow in our preferred TypeScript stack. Android-specific audio work lives in Kotlin. The decision is about dividing responsibilities; using React Native does not require audio frames to traverse JS.

**Follow-up:** What still crosses the boundary? Commands and aggregate metrics, rather than every PCM frame in the new path.

### 4. Why not keep everything in Zustand?

State is useful for observable session status and actions. Socket ownership, timers, capture lifecycles and byte processing belong in services/adapters. Putting high-frequency PCM into app state would couple rendering to streaming and complicate cleanup.

### 5. What does strict TypeScript fail to protect?

External network data and native/runtime behavior. A TypeScript assertion cannot make an incoming string valid. Text controls are parsed and validated with Zod; binary frames need length and field validation. Native compilation and device tests cover different risks.

### 6. Why Expo development builds instead of Expo Go?

Our build includes custom Kotlin modules. Expo Go does not include them. Metro supplies development JavaScript, while a standalone APK bundles it. Native source changes require a rebuilt installed binary.

## Audio fundamentals

### 7. What is PCM16?

Uncompressed amplitude samples represented with 16 bits per sample. The current stream uses mono at 48 kHz. It is straightforward to capture and feed into AudioTrack but uses more network bandwidth than compressed audio.

**Follow-up:** Would stereo be a UI toggle? No. Channel layout, byte counts, validation, capture/playback configuration and tests would all need changes.

### 8. Why 20 ms chunks?

They represent 960 samples, or 1,920 PCM bytes. This is a workable initial balance between formation delay and per-packet overhead, not a proven optimum. Smaller chunks increase processing frequency; larger chunks increase waiting before transmission.

**Follow-up:** Does a three-hour track require huge memory? Not if queues are bounded and old chunks are consumed/discarded continuously.

### 9. What is the bandwidth requirement?

Raw mono PCM is `48,000 × 2 = 96,000 bytes/s`. With our 32-byte header at 50 packets/s, application packets total 97,600 bytes/s per listener. Eight listeners imply about 6.25 Mbit/s before transport overhead. Current multi-client evidence uses simulated peers, not eight physical listeners.

### 10. Why did you remove Base64?

A 1,920-byte block expands to 2,560 Base64 bytes before JSON. The new binary packet is 1,952 bytes including metadata. Native binary transport also avoids per-frame JS handoffs. We have not yet measured the resulting CPU, battery or audible latency changes.

**Follow-up:** Is the new path zero-copy? No. Native byte arrays/buffers are still allocated and copied.

### 11. Can Android capture every music app?

No. Capture depends on Android support, user consent and source policy. Our code currently filters the selected ReVanced Music UID. Other apps are not established as compatible. See [Android playback capture](https://developer.android.com/media/platform/av-capture).

### 12. Are you recording the microphone?

The intended source is Android playback capture configured for the selected app/usage. A permission named RECORD_AUDIO does not mean this pipeline uses microphone input. Trace the playback-capture configuration to explain the distinction.

**Follow-up:** How would you prove the source? Use a known permitted source signal, inspect the UID filter, and distinguish source playback from ambient speech in a controlled test.

## Latency, buffering and clock synchronization

### 13. Why can audio be continuous but delayed?

A queue can provide uninterrupted output while holding old audio. Continuity measures gaps; latency measures elapsed time from source to listener sound. We observed continuity with delay in the previous prototype. More buffering can improve one while worsening the other.

### 14. Where would you look first for latency?

Measure the output, then inspect capture/chunk timing, host queue, socket backlog, guest queue, AudioTrack and route. The guest currently waits for five 20 ms frames before starting. Buffer capacities alone do not reveal current queued duration or total acoustic delay.

**Follow-up:** Why not sum every configured buffer? Some buffers may be partially empty, and processing overlaps. Measure occupancy and timing rather than treating capacity as delay.

### 15. What is your queue policy?

The native host queue holds eight packets and drops the oldest when full. A guest has a 15-frame queue; overflow clears it and keeps the newest frame. The host also checks per-socket backlog before sending. These policies bound application backlog but may cause audible gaps. This is not an adaptive jitter buffer.

**Follow-up:** Does `overflowDrops` count discarded frames? In the current player it counts overflow events, not every frame removed by clearing the queue. Counter names need careful interpretation.

### 16. Why not simply make all buffers tiny?

Audio output must have data when its device clock consumes it. Smaller buffers tolerate less scheduling/network variation and may underrun. Tune one layer at a time using both acoustic results and underrun counters. A good default may differ by device and output route.

### 17. Explain the clock estimator mathematically.

Let `t0` be guest send, `t1` host receive, `t2` host send and `t3` guest receive, all on the respective monotonic clocks.

```text
RTT = (t3 - t0) - (t2 - t1)
offset = ((t1 - t0) + (t2 - t3)) / 2
offset convention: host time minus guest time
guest target = host target - offset + user delay
```

This estimates offset under an approximately symmetric network-delay assumption. The estimator keeps eight samples and chooses minimum RTT, with the latest winning a tie. It is not an average and does not eliminate path asymmetry.

### 18. Work through a clock example.

Take `t0=1000`, `t1=1110`, `t2=1112`, `t3=1022` milliseconds. RTT is `22-2=20 ms`; offset is `(110+90)/2=100 ms`. A host target of 5000 maps to guest time 4900. Adding a positive 20 ms user delay yields 4920.

**Follow-up:** Is `t1 > t3` invalid? No; they belong to different clocks. Local elapsed intervals must be valid.

### 19. What makes a clock estimate ready or stale?

The probe tracker accepts matched pending replies, rejects expired/unknown replies, requires three accepted replies, and expires readiness after 15 seconds without a recent reply. Pending probes expire after about two seconds. A long reply gap resets the estimator. This protects control readiness, not acoustic alignment.

### 20. Why are JS timers insufficient for synchronization?

They can deliver callbacks late when the event loop is busy. The click adapter maps a future monotonic target to the audio clock and schedules playback there. It rejects insufficient lead or an unreliable mapping interval. Callback timing is not used as proof of when sound emerges.

**Critical boundary:** live music does not currently use those click deadlines. It uses queue-based playback.

### 21. Can you synchronize the host with all guests?

Not with the current implementation. Synco captures audio after the source app produces it and cannot delay the source app's own output. Guest-to-guest common playout scheduling is a future direction; host alignment requires addressing this source-output constraint. Bluetooth and device buffers further affect what people hear.

### 22. What is drift, and how might you correct it?

Independent audio clocks can consume samples at slightly different rates, causing queue growth or depletion over time. Next steps could include measuring playback position against a shared sample timeline and applying small controlled rate corrections. Abrupt sample drops can cause artifacts. Drift correction is not implemented or validated here.

## Transport and protocol

### 23. Why WebSocket, and what is its downside for live audio?

It provides framed text/binary messages over TCP and was convenient for the prototype. TCP retransmission preserves ordered delivery but can delay later audio behind missing network data. Reliability is not equivalent to timely playout. See [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455).

**Follow-up:** Would UDP solve everything? No. It would require explicit loss/reordering handling, congestion behavior, admission/security and testing. WebRTC is another option to evaluate, with added integration complexity. Neither is the current transport.

### 24. Why track sequence numbers if TCP preserves order?

The app intentionally drops frames under pressure, and stale data can come from lifecycle transitions. Sequence/sample metadata helps diagnose gaps and reject duplicates/stale progression at application level. A missing sequence does not prove a network packet was lost; TCP may have delivered all bytes that were actually sent.

### 25. What is in the binary header?

It is 32 bytes: magic, version, header size, encoding, channels, epoch, sequence, sample position, sample rate, sample count, payload length and reserved bytes. Integer fields use the specified little-endian representation. The complete packet is fixed at 1,952 bytes for this format.

The source is [audio-wire.json](../../packages/protocol/src/audio-wire.json). Explain what each field protects: format mismatch, wrong size, stale stream or invalid progression.

### 26. What is an epoch, and is it a timestamp?

It identifies one capture run. A new run chooses a new epoch so the guest can distinguish it from older queued packets. It is not wall time, encryption or a cryptographic replay-proof protocol. The current random epoch is not a mathematical guarantee against collision.

### 27. Does sample position tell you when to play?

It gives a position in the capture's sample timeline, not a directly comparable wall-clock timestamp. Converting it to presentation time would require a timeline anchor and scheduling policy. Current code validates progression but does not schedule live playback from it.

**Follow-up:** What about integer wrap? Unsigned counters wrap; comparisons must use modular forward-distance logic rather than ordinary signed ordering.

### 28. How do TypeScript and Kotlin agree on the wire?

A checked-in JSON specification feeds native code generation. TypeScript encoding/validation and tests use the shared contract; `wire:check` detects generated-file drift. That reduces accidental inconsistency. It is not a complete proof of cross-language behavior; golden fixtures and native decoder tests would strengthen it.

### 29. Why two version numbers?

Control messages use version 1 while the audio capability is wire version 2. HELLO/WELCOME advertise the audio wire capability. This allows explicit rejection of old audio peers instead of trying to interpret incompatible bytes. Control and media formats evolve independently.

### 30. How do you stop one slow listener affecting everyone?

There are bounds at the host queue and per-socket backlog checks so we can skip audio for a congested peer rather than accumulating indefinitely. This needs slow-peer stress testing; a shared fan-out worker and transport implementation still require scrutiny. Do not claim total isolation just because a queue is bounded.

## Security, lifecycle and implementation details

### 31. What does the join token protect?

It gates session admission. The host generates a random token and shares it through the join code. Current local `ws://` traffic is not encrypted, so the token and audio lack transport confidentiality. Being on a LAN does not make traffic automatically private.

**Follow-up:** What would production need? A threat model, protected transport/key exchange and careful token/log handling, plus abuse and lifecycle tests. These are future work.

### 32. How do you handle malformed or unauthenticated peers?

Validate control messages, enforce admission/readiness, reject wrong capabilities, bound input sizes/rates and cap sockets. The native host currently caps eight sockets, including unauthenticated ones. Negative smoke checks cover wrong-token, unauthenticated probe and malformed-text behavior.

**Follow-up:** Is eight an achieved scale metric? No; it is a configured limit. Load and denial-of-service behavior need separate tests.

### 33. What happens when an Activity backgrounds or a socket closes?

Host capture can run in its foreground service while the source music app is visible. The guest currently stops when backgrounded. Departure removes the peer and session cleanup stops associated work. Reconnect is not automatic. ADB disappearing does not stop the foreground service.

### 34. Which races deserve a focused review?

Stop while a write blocks, a new capture starting before old callbacks finish, socket close during fan-out, and a stale native failure arriving after a new session starts. Generation/epoch guards help, but shared fields and worker shutdown still need stress tests. `volatile` visibility alone does not make a multi-step lifecycle atomic.

**Source exercise:** Inspect `LivePcmPlayer.stop()`, its worker `finally`, and capture start/stop ownership. Explain what happens if a worker outlives a timed join.

### 35. What happens on partial audio reads or writes?

The player loops until a frame's bytes are written or playback stops, handling partial writes. The current capture path accepts full-sized blocks; short reads are not accumulated into the next full frame. That is a concrete edge case to investigate, not something to silently claim solved.

See the implementation and the [AudioTrack API](https://developer.android.com/reference/android/media/AudioTrack) when explaining write return values and output diagnostics.

## Testing, measurement and ownership

### 36. What have you actually tested?

The recorded full check passed 23 Jest tests, typecheck, lint and wire-generation consistency. Native debug/release builds passed. The standalone app cold-launched without Metro. Physical host tests delivered valid non-silent packets, exercised admission/control with simulated peers, and checked Stop/restart. The redesigned physical receiver remains untested.

**Follow-up:** Did all 23 tests exercise native audio? No. They are software tests for the covered JS/TS/shared logic, not an Android acoustic test suite.

### 37. How would you measure real latency?

Use authorized identifiable test audio and record both outputs on a common timebase. Compare onset positions across at least 20 events, then run for five minutes to observe drift/dropouts. Report p50/p95/max and route/build/network conditions. Collect native counters alongside this, but do not substitute them for acoustic output.

### 38. A guest has zero missing frames but is delayed. What next?

Inspect queue occupancy, startup buffering, output buffering and route. Verify that counters mean what you assume. Compare speaker and earphone routes, then network variants with other conditions held constant. “Zero missing” means a particular counter saw no gaps; it does not prove low latency.

### 39. Why can a successful build still fail a demo?

Builds do not establish capture permission/policy, route selection, network reachability, source playback or actual AudioTrack output. Standalone launch verifies packaging, not streaming. Prepare a tested scenario and an honest fallback, and avoid changing the environment immediately before the demo.

### 40. What did you personally contribute if AI helped?

Give your actual division of work: product decisions, constraints, experiments you ran, feedback you provided, code you reviewed and changes you can explain. AI assisted implementation and documentation. Do not claim unaided authorship or pretend to understand code you have not studied. Demonstrate ownership by tracing, changing and testing a feature live.

### 41. What would you improve next, and why?

First validate the native receiver on the second phone. Then measure and attribute delay, tune buffers with continuity checks, and evaluate a shared listener presentation timeline/drift handling. Improve lifecycle/reconnect and security before broader release. Changing transport or adding a codec before locating the main bottleneck would make results harder to interpret.

### 42. What would make you change the architecture?

Evidence that TCP stalls dominate despite sensible buffering could justify another transport. Bandwidth/battery results could justify compression. Required background listening would require receiver lifecycle work. Strong host/guest alignment requirements force a review of how the host hears the source. Tie each redesign to a measured limitation or a product requirement.

## Whiteboard drills

1. **Draw a packet:** label the 32-byte header and 1,920-byte payload; explain validation before playback.
2. **Calculate occupancy:** seven queued frames represent 140 ms of PCM waiting in that queue, not total end-to-end delay.
3. **Debug a restart:** draw old epoch A, Stop, new epoch B and a late A packet. State which layer rejects it.
4. **Design a test:** one guest becomes slow while another stays fast. Predict queue/drop counters and what audible evidence would confirm isolation.
5. **Explain an unknown:** say “I haven't measured that yet; here's the test and the evidence I would need,” then describe a falsifiable experiment.
