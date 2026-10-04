# Synco delivery plan

Effort ranges are planning estimates for one developer with devices ready, not promised dates.

| Phase | Work | Exit evidence | Estimate |
|---|---|---|---|
| Foundation (this starter) | TS workspaces, app shell, tests, compact context, skills | typecheck/lint/tests; native launch pending | complete after verification |
| 0: feasibility | Two Android phones, phone-host WS, click track, ping/pong, future start | repeated recordings with measured onset error; engine decision | 2-4 days, native fallback may add 1-2 weeks |
| 1: useful stream | Host file picker, QR/token join, bounded chunks, decoder, sim-host | one host + multiple guests audibly receive local file; malformed messages rejected | 4-7 days |
| 2: synchronization | jitter buffer, synchronized pause/start, drift resync, persisted delay, debug metrics | measured alignment near +/-20-40 ms on tested speaker routes; compensation verified | 4-7 days |
| 3: resilient Android MVP | reconnect, re-clock, catch-up, screen lock, foreground service, interruptions | join/leave/dropout/lock test matrix without breaking other guests | 4-7 days |
| 4: iOS verification | native engine/network permissions and background behavior | physical iOS and mixed-device matrix | 3-7 days plus discovered native work |

For Phase 0: <=40 ms is a provisional pass; 40-100 ms requires investigation and another run; >100 ms triggers evaluation of native scheduling before feature UI work.
Measure repeated starts and sustained playback, record distributions and failures; a single good sample does not pass.
Each phase delivers one vertical slice and refreshes only the touched feature context.

MVP excludes browser guests, mDNS, WebRTC, stream URLs, queue, user-facing seek, continuous rate correction, and automatic Bluetooth latency detection.
Internal drift correction may require repositioning; that does not add a user-facing seek feature.
