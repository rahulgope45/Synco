---
name: sync-spike
description: Design or evaluate Synco clock, audio scheduling, drift, or physical-device synchronization experiments.
---

Read docs/PHASE-0.md and the audio/sync feature context. Use monotonic milliseconds and offset = host minus guest.
Keep clock estimation separate from output latency. Asymmetric network delay biases estimates even with low RTT.
Use an injectable clock for pure tests and a documented native clock mapping for scheduled playback.
Test symmetric/asymmetric delays, jitter, missing replies, reconnection reset, stale commands, and late buffers as relevant.
Require real recording evidence for audible alignment claims. Record device/route, repeated-start distribution, sustained drift, and dropouts.
Select the engine based on measured scheduling and chunk support. Never treat a play() promise or JS timer as proof of precise onset.
