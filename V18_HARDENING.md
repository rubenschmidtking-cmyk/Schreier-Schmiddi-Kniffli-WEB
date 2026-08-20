# V18 Multiplayer Hardening

- Host authority heartbeat heals missed START and REMATCH events.
- Host is the only client allowed to initiate rematches, preventing split-brain game IDs.
- Broadcast acknowledgements enabled.
- Multiplayer protocol version is advertised in Presence and attached to every game message.
- Incompatible app versions cannot start a match together.
- Score cards and remote dice snapshots are sanitized before use.
- Missing/invalid score fields are no longer accidentally counted as completed.
- Existing V17 deterministic turn derivation and periodic player snapshots remain in place.
- CI now runs TypeScript typecheck, tests, and production build.
