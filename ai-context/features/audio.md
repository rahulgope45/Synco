# Audio

Updated: 2026-10-05.

## Status
Native AudioRecord playback capture sends fixed PCM packets directly to native host network queue. Native guest validates binary frames and feeds AudioTrack. Per-frame base64/JS traffic removed. Physical end-to-end listening still pending.

## Paths
`apps/mobile/modules/synco-host/android/src/main/java/expo/modules/syncohost/`: `CaptureProbeModule.kt`, `LivePcmPlayer.kt`, `SyncoHostModule.kt`, `SyncoGuestModule.kt`, generated `AudioWire.kt`. TS `capture-probe.ts` and `spike-session.ts` own consent/commands only.

## Decisions
Keep 48 kHz mono PCM16, 960 samples/20 ms, WebSocket and AudioTrack for comparable A/B test. Receiver still waits for five frames (100 ms), with 15-frame queue (300 ms capacity). Capture UID remains `app.revanced.android.apps.youtube.music`; source app controls itself. Consent, foreground notification and Stop retained.
Native guest reports every 250 frames: received/missing/discarded, queue, overflow drops, written frames and AudioTrack underruns. Host exposes sent/dropped/queued counts. These are software counters, not audible latency or clock alignment.

## Evidence and risks
Prior base64 prototype was continuous but delayed on RMX3085 -> V2146; baseline APK preserved. `npm run check` (23 tests), debug/release builds and standalone cold launch on RMX3085 passed. ReVanced playing: two release capture runs sent 830 and 853 valid non-silent binary packets to a simulated listener, with fresh epoch, Stop propagation and service teardown verified. Native guest output/acoustic delay remain untested. Playback failure is surfaced via native event; background listener closes until Phase F.

## Next action
Run matching APKs on two phones; compare acoustic delay/dropouts with baseline over speakers and then earphones. Tune startup and queue targets only with measured underruns/latency. No guarantee for official YT Music or Spotify.
