# Session

Updated: 2026-10-04

## Status
Contracts only; no live session.

## Code paths
apps/mobile/src/services/session/contracts.ts; packages/protocol/src/index.ts

## Decisions
QR carries IPv4, port, token and protocolVersion; validate before connecting.

## Evidence
No physical-device verification yet. See foundation.md for automated validation.

## Open risks
Secure random token generation, admission, camera scan and join lifecycle remain unimplemented.

## Next action
Choose native host transport, then implement token generation and HELLO/WELCOME.
