# 2. What problem Synco solves, and how

The motivating story is a couple wanting to hear the same music together without splitting one pair of earphones. The broader use case is a small nearby group listening to one source, each through their own phone and output device.

The intended experience is simple: **host a session, join it, share audio, listen together**. Synco handles the connection and stream. The host uses their normal music app to choose or pause a song.

## Why this is a streaming problem

Sending a song file is a different product: the source app may not expose a file, and every guest would then need coordinated playback. Our chosen approach captures permitted playback while it happens and forwards small audio chunks.

We do not wait for a complete track. A live stream can continue indefinitely. Each frame represents a short time interval and can be transmitted as soon as captured. File size is therefore not the main reason for our chunk size; **responsiveness, scheduling overhead and network jitter** determine it.

## Follow one chunk

1. Android capture provides PCM samples from the selected source UID.
2. A complete 960-sample block becomes one packet with stream and ordering metadata.
3. The native host worker fans it out to admitted, ready guests.
4. Each guest validates the binary contract and stream ordering.
5. A bounded queue feeds AudioTrack on a native thread.
6. The device's audio route turns samples into sound.

The host's own music continues playing through the source app. Synco does not control or delay that original playback. This is a central limitation when trying to align the host with guests.

## The chunk arithmetic

Current format: **48,000 samples/second, mono, PCM16, 20 ms per chunk**.

```text
Samples per chunk = 48,000 × 0.020 = 960
PCM bytes per chunk = 960 × 1 channel × 2 bytes = 1,920
Packet bytes = 1,920 PCM + 32 header = 1,952
Packets per second = 1 / 0.020 = 50
Raw PCM rate = 96,000 bytes/s = 768,000 bits/s
Packet rate per listener = 97,600 bytes/s = 780,800 bits/s
```

The last number excludes WebSocket/TCP/IP overhead and retransmissions. Eight listeners would require about 6.25 Mbit/s of application packet output because the host sends one copy per guest. That is arithmetic, not an eight-device benchmark.

Smaller chunks reduce the wait to form a chunk but increase calls, headers and scheduling work. Larger chunks amortize overhead but add collection delay. Changing 20 ms to 5 ms does not remove a 100 ms playback buffer.

## Four terms interviewers will separate

| Term | Meaning here | Example |
| --- | --- | --- |
| Latency | Time from source sound/event to listener sound | Listener hears a beat later than host |
| Jitter | Variation in arrival timing | Packet spacing changes despite regular capture |
| Skew | Difference between devices' audible output times | Two listeners hear the same beat at different times |
| Drift | Timing difference changing over time | Initially close outputs diverge over several minutes |

Continuous audio can still be delayed. Two delayed guests could be aligned with one another while both lag the host. Low network RTT does not prove low acoustic latency.

## Where delay can accumulate

```text
Capture + chunk formation + host queue + network
  + guest queue + AudioTrack/output buffering + output route
```

The guest currently waits for five frames before playback: about 100 ms of queued audio. Its 15-frame queue has a 300 ms capacity. AudioTrack also has configured buffer capacity. Capacity is not the same as current occupancy, and capacities cannot simply be added to claim measured latency.

Bluetooth earphones can introduce route-specific delay outside our application queue. A speaker result cannot automatically be applied to every earphone configuration.

## Wi-Fi versus personal hotspot

A hotspot is an alternative local network, not an automatic latency fix. It might help when an existing router is congested; interference, band, power saving and hotspot implementation can also make it worse. Peer reachability must work in the chosen topology.

Compare the same phones, output routes and build on both networks. Measure audible delay distributions, dropouts and queue/underrun counters. If most delay is in buffering or the audio route, changing the network will have limited effect.

Synco's transport requires no backend or runtime internet. The source music app may still need internet to fetch music.

## Compatibility and consent

Android playback capture is available from Android 10 and depends on permissions, user consent and the source application's capture policy. It is not a universal system-audio bypass. See [Android playback capture](https://developer.android.com/media/platform/av-capture).

Our current implementation targets the selected ReVanced Music UID. Other source apps need explicit selection/configuration work and actual tests; their capture policy may prevent this flow.

## What success should mean

Success requires a usable join flow, continuous sound, bounded delay, acceptable listener alignment and predictable Stop/Leave behavior. Measure them separately. Before declaring “in sync,” define a target for the actual route and user experience, then test it acoustically.

The current product direction is credible, but the core promise of comfortable shared listening remains a physical validation goal. [The validation matrix](../validation/native-audio-2026-10-05.md) records what is still missing.
