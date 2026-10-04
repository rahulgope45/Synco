# Session

Updated: 2026-10-04

## Status
Phone hosting, random-token admission, manual join codes and leave/end implemented.

## Code paths
packages/protocol/src/host-admission.ts; apps/mobile/src/services/network/phone-host.ts; state/spike-store.ts

## Decisions
Fresh native SecureRandom 128-bit token per session. HELLO/WELCOME gates access; READY reports guest clock readiness. UI shows joined/ready counts.

## Evidence
Two physical Android phones passed join/readiness/group-click smoke; user heard both as one beat. See docs/validation/two-phones-2026-10-04.md. Acoustic timing remains unmeasured.
Native Android build/install passed; 19 automated tests passed.
Live phone-host (2 simulated guests) and phone-guest LAN smoke tests passed.
See docs/validation/phone-network-2026-10-04.md.

## Open risks
QR camera/generation still pending; manually share code in Phase 0. Backgrounding ends sessions.

## Next action
Record repeated two-phone starts; add QR with streaming phase.

