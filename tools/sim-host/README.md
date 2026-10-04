# Phase-0 computer test host

Run `npm run sim-host` at the repo root. It listens only on 127.0.0.1:8787.
Forward the port to each connected phone: `adb -s DEVICE_SERIAL reverse tcp:8787 tcp:8787`.
In Synco, press **Connect test host** and wait for **Clock ready**.
Press Enter in the host terminal to schedule eight clicks on all connected guests three seconds ahead.

This intentionally uses ADB forwarding and does not measure the intended phone-host Wi-Fi path.
It is a development-only protocol subset: PING/PONG, PLAY_AT at position 0, and BYE.
No user files, tokens, QR admission, streaming, background service or phone-host server are implemented here.
The app rejects late starts, requires three fresh matched probes, and stops on background/disconnect.
For the actual Phase-0 gate, follow docs/PHASE-0.md with two phones and an acoustic recording.
