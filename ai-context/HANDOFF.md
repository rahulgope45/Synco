# Resume Synco

Stage: Phase 0 phone-host networking implemented and verified on two physical Android phones.
User goal: one host shares music with multiple devices that play together over Wi-Fi/hotspot.
User preference: keep committing coherent, tested checkpoints locally; no remote/push requested.
Baseline commit: 78f6d52. See git log for later checkpoints.
Devices: RMX3085 host and V2146 guest, both Android 13, wireless ADB. Recheck adb devices before use.
Implemented: native Android WS host, token admission, manual join codes, guest clock probes, native click scheduling, host group start.
Verified: 20 tests, native build/install, two simulated Wi-Fi guests, phone-as-guest scheduled playback and leave.
Evidence: docs/validation/phone-network-2026-10-04.md; docs/PHONE-SESSIONS.md.
Current task: user prioritized sharing installed ReVanced Music output. Capture and continuous live playback passed on the two phones; user confirms delayed output. Stop propagation passed. Next: measure and reduce live receiver latency, with source synchronization still unsupported. See docs/LIVE-MUSIC.md and docs/validation/live-music-2026-10-04.md.
Read: features/network.md, session.md, audio.md, sync.md; docs/PHASE-0.md.
Native source: apps/mobile/modules/synco-host (generated apps/mobile/android remains ignored).
Build on Windows with Git bin + usr/bin on PATH; see docs/DEVICE-TEST.md.
Two-phone click smoke passed; user heard both as one beat. No acoustic alignment measured. Experimental app-audio streaming exists; no synchronized live music, drift correction, background listener or iOS host.
Existing dependency advisories remain documented; no forced downgrade applied.

Two-phone evidence: docs/validation/two-phones-2026-10-04.md; reusable tools/device-smoke/two-phones.ts.
