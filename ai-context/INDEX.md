# Synco context map

Product: share audio across phones on Wi-Fi/hotspot. Current user priority: installed music-app output sharing; local files remain the fully controllable sync path.
Stack: React Native + TypeScript; Expo development builds; Zustand; Zod; Jest.
Current stage: Phase 0 in progress; two physical phones passed group-click smoke; recorded acoustic timing next.

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
