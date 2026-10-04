# Synco delivery plan

Updated 2026-10-04 after the user clarified scope and selected native audio delivery.
Synco shares an existing music app's output; it does not own music selection or playback controls.
This supersedes the earlier file-player-first roadmap. Historical versions remain in Git.

Detailed steps and exit criteria: [Native audio migration](NATIVE-AUDIO-PLAN.md).

| Phase | Deliverable | Exit evidence |
|---|---|---|
| A: baseline | Stage/queue/underrun telemetry and acoustic measurements | Reproducible current-build results; unknowns explicit |
| B: contract | Binary framing, negotiation, generated native validation | TS/native interoperability and malformed/unauthorized frame tests |
| C: native delivery | Native capture, sender, guest WS and output; TS UI/control | No PCM crossing JS; continuous two-phone audio; measured comparison |
| D: tuning | Buffer/packet/output tuning and hotspot comparison | Lower measured delay without unacceptable dropouts on named routes |
| E: receiver alignment | Native timeline, drift handling, late joins | One host/two listeners; recorded alignment/drift; slow guest isolation |
| F: reliable APK | Background listening, reconnect, interruption handling | Device matrix, standalone APK, known limits and handover |

Retain WebSocket, PCM and AudioTrack initially; alternatives need measured justification.
Acoustic claims require recordings. Source-to-listener and listener-to-listener alignment are separate.
QR polish, other source apps, iOS, internet streaming, codecs and UDP/WebRTC are follow-up decisions.
Each phase ends in a tested local commit and compact feature-context update; no push requested.
