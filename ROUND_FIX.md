# V5 Round Progression Fix

Fixed a React effect cleanup race that cancelled the next-round timer immediately after `advancing` changed.

## Fixed
- Online 1v1 now advances through all 19 rounds.
- CPU mode now advances through all 19 rounds.
- Online mode ignores stale state packets from earlier rounds.
- Round refs are updated immediately during sync/rematch to reduce race conditions.
