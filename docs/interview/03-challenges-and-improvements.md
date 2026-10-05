# 3. The hardest challenges and how we improved the design

The strongest challenge story is **getting live audio across several execution layers without letting buffering turn continuity into excessive delay**. Present the redesign as an implemented architectural change whose end-to-end benefit still needs measurement.

## A concise STAR answer

**Situation:** The first two-phone music prototype produced breakup. After changes it became continuous, but the listener still heard music later than the host.

**Task:** Make the streaming pipeline more predictable while preserving admission, readiness and clean shutdown.

**Action:** We separated frequent audio data from TypeScript control. We replaced the per-frame Base64/JS path with native binary frames, introduced a versioned format with stream epochs and sample positions, bounded queues, added aggregate counters, and kept validation in a shared protocol contract with generated Kotlin support.

**Result:** The new path builds, and a physical host delivered valid non-silent binary audio to simulated listeners. Stop and restart passed. The next result to establish is physical guest playback and measured latency; we have not claimed a latency reduction yet.

## Challenge 1: Too many transformations in the frequent path

```text
Earlier:
native capture -> Base64/JS events -> JS control/network handling
  -> receiver JS -> native decode/playback

Current:
native capture -> binary native socket -> native receiver -> AudioTrack
```

The old design made a proof of concept possible, but its frequent conversions and JS handoffs were undesirable for steady streaming. The new path removes that work from each PCM frame. Commands and aggregate diagnostics still reach JS.

One 1,920-byte PCM block becomes 2,560 bytes in Base64 before JSON. Our binary packet is 1,952 bytes including its header. This is a format-size comparison, not a measured throughput, CPU or latency improvement. Native packet allocations still exist.

## Challenge 2: Smoothness and delay pull in different directions

A receiver needs enough queued audio to tolerate late arrivals. More queued audio can hide jitter but means older sound is played. “No gaps” and “low delay” must be separate acceptance criteria.

The current player waits for five frames and bounds its queue at 15 frames. Overflow clears queued data and keeps the newest arrival, which limits stale backlog but can produce an audible discontinuity. It is a simple policy, not an adaptive jitter buffer.

The next improvement should follow measurement: reduce startup/queue targets step by step while checking underruns and audible gaps. Do not shrink every buffer at once and lose the ability to attribute the result.

## Challenge 3: Correct packets can belong to the wrong stream

Stop/restart can leave old work in queues or callbacks. A sequence number alone cannot identify whether packet zero belongs to today's capture or a previous capture.

Each capture gets an epoch. The guest checks epoch, sequence and sample progression, and stops accepting the stopped stream. This helps reject stale or duplicate data. It does not eliminate every concurrency race; start/stop overlap and delayed callbacks still deserve stress tests.

## Challenge 4: A connection is not a ready listener

A socket can exist before admission or before a guest is ready. We keep token admission and readiness checks, enforce protocol compatibility, and remove departed peers. Simulated-client tests exercise wrong tokens, malformed input and multi-client control behavior.

The token is an admission mechanism. Current `ws://` traffic is unencrypted. Do not describe this as production-grade secure streaming.

## Challenge 5: Device evidence is harder than software checks

The second phone became unavailable. We continued with useful one-phone checks: standalone launch, capture framing, non-silent payloads, simulated clients, Stop and restart. We explicitly left native guest sound and acoustic measurements pending.

During an earlier connection outage, capture remained active after ADB disappeared. It was found and stopped on reconnection. Later release tests verified service teardown after Stop. The lesson: **a lost debugging connection does not mean the app or its foreground service stopped**.

## Challenge 6: Clock synchronization is not audio synchronization

Clock probes estimate a host/guest time relationship. The click adapter schedules on the audio clock, avoiding JS-timer precision claims. However, live music currently plays from a queue rather than a shared presentation timeline. Device output buffers and routes add further differences.

Also, Synco cannot hold back the host's original source playback. Even ideal listener scheduling cannot undo audio that the host already heard. Explain this product constraint before promising host/guest alignment.

## What the evidence lets you say

| Safe statement | Statement to avoid |
| --- | --- |
| Removed Base64 and per-frame JS handoffs from the new music path | Reduced latency by a made-up percentage |
| Added bounded queues and diagnostics | Eliminated all jitter and dropouts |
| Verified host delivery to simulated peers | Verified the redesigned stream across eight phones |
| Earlier two-phone clicks sounded aligned to the user | Proved sub-millisecond synchronization |
| Built an Android capture prototype for the selected source | Supports every music app |

See [the dated evidence](../validation/native-audio-2026-10-05.md). A strong answer ends with the experiment you would run next, not an unverified victory claim.

## Next experiment to explain in an interview

Use the same two phones and speaker routes for the old and new builds. Record both outputs on one timebase using an authorized test signal. Measure at least 20 onsets and a five-minute run, then compare p50/p95/max delay, drift and dropouts alongside queue and underrun counters. Repeat with earphones and hotspot separately. This distinguishes network problems from buffering and route delay.
