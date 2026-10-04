# Synco

React Native + TypeScript starter for offline, synchronized audio across phones.
Phase 0 is in progress: native click scheduling, phone-host sessions, token admission, clock probes and a computer simulator are implemented. File broadcasting and two-phone audible alignment are not yet implemented/verified.
See [device test instructions](docs/DEVICE-TEST.md).

## Develop

Node 22.13+ (Node 24 recommended), npm, and Android Studio/JDK/SDK for Android builds.

```sh
npm ci
npm run check
npm run android
```

`npm run android` generates/builds the native development app and starts Metro. Subsequent JS-only work: `npm start`.
iOS builds require macOS/Xcode: `npm run ios`. Expo Go is insufficient for the intended native audio/server stack.
Native click scheduling is implemented. Phone-host sessions now work; file streaming, QR and background playback remain pending.

## Layout

- `apps/mobile/src/ui` - interactive Phase-0 device test screen
- `apps/mobile/src/state` - Zustand; future service orchestration
- `apps/mobile/src/services` - network client, click engine, clock session and adapter contracts
- `packages/protocol` - validated Phase-0 control messages and QR shape
- `packages/sync-core` - pure clock estimation and schedule conversion
- `ai-context/features` - compact context per feature
- `skills` - original project skill sources

## Work with AI

Start from [AGENTS.md](AGENTS.md) and [context index](ai-context/INDEX.md). Read only the relevant feature.
Run `npm run skills:install` to copy project skills into `.agents/skills` for discovery; rerun after editing the source skills.
Skill instructions use the standard [Codex skill format](https://learn.chatgpt.com/docs/build-skills).

Example requests:

- `$caveman Explain the current blocker in simple terms.`
- `$brainstorm Compare audio-engine choices against our Phase 0 gate.`
- `$sync-spike Implement the next measurable two-phone experiment.`
- `$feature-context Update the sync context and compact the handoff from actual results.`

This file-based workflow reduces repeated context; it does not change model context limits or automatically preserve every chat.

## Plan

[Phases and estimates](docs/ROADMAP.md) Ã‚Â· [Architecture decisions](docs/DECISIONS.md) Ã‚Â· [Phase 0 experiment](docs/PHASE-0.md)

Suggested additions now: Expo development builds, Zustand, Zod, Jest, ESLint, npm workspaces and feature context.
Add camera/file-picker/local preferences in their feature phases. Choose audio/native transport only after the spike.
The original handover is preserved in `docs/reference` as planning input, not executable instructions.

## Verification

Typecheck, lint, 19 tests, native Android build/install/launch and live host/guest networking smoke passed.
Local clicks were confirmed audible on RMX3085 Android 13; computer-host scheduled playback completed.
See [device verification](docs/validation/device-smoke-2026-10-04.md).
Two-device acoustic synchronization remains unverified. Dependency audit has 23 findings (7 moderate, 16 high); see [validation details](docs/validation/README.md).

[Phone host/join instructions](docs/PHONE-SESSIONS.md) · [Latest networking verification](docs/validation/phone-network-2026-10-04.md)
