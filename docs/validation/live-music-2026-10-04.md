# Live app audio validation — 2026-10-04

Devices: RMX3085 host and V2146 listener, Android 13, same Wi-Fi. Source selected by user: installed ReVanced Music 8.10.52 (target SDK 35). Official YouTube Music was not installed and is not verified.

## Capture compatibility

Package flags include ALLOW_AUDIO_PLAYBACK_CAPTURE. This alone was not treated as proof.
Physical 30-second stereo probe received 2,880,000 samples and peak amplitude 29,670 while the source player was playing. UID-filtered AudioPlaybackCapture was used; no microphone, video capture, or audio file was created. Foreground capture service was observed active while the source app was foreground.

## Live playback

Experimental mono PCM transport implemented using the existing admitted phone session. Initial listening result from user: music plays on the second phone but breaks up. No smoothness or synchronization claim follows from this result.
The initial async send gate could discard frames while a preceding send was pending. Replaced with one synchronous native fan-out to admitted listeners and bounded per-socket frame drops. Receiver now displays sequence gaps. A screen-awake threading issue in the intermediate build was corrected by dispatching onto Android's UI thread.

Final retest: user confirmed continuous music, but delayed. Receiver UI advanced from frame 5000 to frame 9000 with zero missing frames (80 seconds between these counters). Clock remained ready. This does not measure output underruns or acoustic latency. Host was in ReVanced Music during streaming. The strict control-socket busy check was replaced with bounded byte thresholds: 16 KiB for audio admission, 64 KiB for control rejection. Intermediate runs also showed the guest leaving Synco for the developer menu/settings, which stops this foreground-only receiver.

Stop verification passed: host capture foreground service ended, receiver displayed Music sharing stopped, and the phone session remained joined/clock-ready. Native build/install, typecheck, lint and all 20 tests passed.

No recorded latency, multi-listener timing, five-minute drift, or Bluetooth test. Source playback is not delayed by Android capture. Receiver waveform timing is not measured by the clock probe.

Post-stream regression: both physical phones again finished the scheduled eight-click start after capture stopped.
