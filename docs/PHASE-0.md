# Two-phone feasibility run

Prerequisites: two physical Android devices, Android Studio/JDK/SDK, USB debugging, one hotspot, a local click track, and a third recording device. iOS validation later requires a Mac/Xcode and physical iPhone.

1. Implement a phone-host WebSocket server and a guest client behind Transport. A laptop simulator helps development but does not satisfy this gate.
2. Load the same click track locally on both phones to isolate scheduling before chunk streaming.
3. Collect about ten four-timestamp probes, retaining the minimum RTT of the latest eight. Use monotonic clocks; document the mapping to native audio time.
4. Schedule both devices at a future host time with enough lead time for buffering and negative compensation. Use the audio engine's scheduler, not JS setTimeout as the timing authority.
5. Record at least twenty starts, then sustained playback over five minutes. Place recording mic equidistant from speakers or account for acoustic travel distance. Identify each device's waveform distinctly.
6. Save device models/OS, engine version, route, network, lead time, RTT, offset estimate, signed/absolute audible error, p50/p95/max error, dropouts and raw recording location.
7. <=40 ms repeated alignment: provisional pass; 40-100 ms: investigate and repeat; >100 ms: evaluate native scheduled playback. State the exact devices/conditions the result covers.

Report clock offset, playback drift, and acoustic error as separate quantities.
Repeat with Bluetooth separately; do not hide a route-specific failure behind a global average.
No results collected yet. Update ai-context/features/audio.md and sync.md after the run.
