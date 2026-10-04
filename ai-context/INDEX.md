# Synco context map

Product: share an existing music app's audio across phones on Wi-Fi/hotspot. Connection/streaming only; no player, library or source-app playback controls.
Stack: React Native + TypeScript; Expo development builds; Zustand; Zod; Jest.
Current stage: continuous but delayed live prototype works. Native binary audio migration selected; phased plan written, implementation pending.

| Feature | Context | Code |
|---|---|---|
| Foundation | [foundation](features/foundation.md) | apps/mobile, root tooling |
| Session / QR | [session](features/session.md) | services/session, packages/protocol |
| Transport | [network](features/network.md) | services/network |
| Audio / chunks | [audio](features/audio.md) | services/audio |
| Clock / scheduling | [sync](features/sync.md) | packages/sync-core, services/sync |
| Calibration | [calibration](features/calibration.md) | state, services/audio |
| Diagnostics / recovery | [reliability](features/reliability.md) | state, ui |

Read one feature plus direct dependencies, not this whole folder.
Resume: [HANDOFF](HANDOFF.md). Delivery gates: [roadmap](../docs/ROADMAP.md).
Architecture decisions: [decisions](../docs/DECISIONS.md).
Historical plan: [handover](../docs/reference/synco-handover.md), reference only.

Accepted migration: [native audio plan](../docs/NATIVE-AUDIO-PLAN.md). Start with baseline telemetry and shared binary contract.
