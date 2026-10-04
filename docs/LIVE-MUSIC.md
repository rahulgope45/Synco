# Live music sharing (experimental)

This mode targets the installed `app.revanced.android.apps.youtube.music` package, selected by the user. Official YouTube Music has not been tested and is not installed on the test phones.

1. Open Synco on both phones and create a phone session on the music phone.
2. Join from the listening phone using the session code; wait for one clock-ready guest.
3. On the host tap **Share music app audio**, then approve Android's capture prompt.
4. Open ReVanced Music on the host and play. Leave Synco open on the listener.
5. Stop from Synco's **Stop music sharing**, the capture notification's **Stop**, or end the session.

A separate 30-second compatibility check is below the diagnostics when not in a session. It counts samples and peak level without saving or sending audio.

## Implementation and limits

Android AudioPlaybackCapture + MediaProjection, restricted to the selected music app's UID. RECORD_AUDIO is required by Android; no microphone source or screen/video capture is created. A foreground mediaProjection service permits the host to switch apps. Consent is requested for every start; revocation stops capture. No audio files are saved.

The existing authenticated LAN WebSocket carries `AUDIO_PCM`: 20 ms / 960 samples of 48 kHz mono PCM16 little-endian, base64 encoded into bounded 4 KiB messages. Schemas live in packages/protocol. Admission remains in TypeScript. Approximate payload bandwidth is 128 KB/s per guest before WebSocket overhead. This uncompressed bridge is a prototype, not the final codec/transport.

Native AudioTrack consumes a queue capped at 15 frames, with an initial five-frame cushion. Overflow discards queued audio to bound latency. Sender sockets drop live frames above 16 KiB queued; controls reject genuinely slow peers above 64 KiB; the receiver reports sequence gaps. These counts do not detect all playback underruns.

Live mode is **not synchronized**: the source app controls its own playback and cannot be delayed by this capture API. Different receivers can have different latency. Click-test clock readiness is only an admission prerequisite here; it does not schedule live PCM. No drift correction, stereo, reconnect, background listener, or iOS support yet.

An app can deny capture at runtime even if its manifest allows it. A passing test covers only the tested app/version/content/device. The accepted next step is native binary audio delivery; adding a local-file player is outside the user's chosen scope. See NATIVE-AUDIO-PLAN.md.

Reference: https://developer.android.com/media/platform/av-capture
