import type { PlayerState } from './types'
import { filledCount, isScoreCardComplete } from './scoring'

export interface DerivedTurnState {
  ready: boolean
  valid: boolean
  finished: boolean
  round: number
  turnIndex: number
  counts: number[]
  reason?: string
}

/**
 * Turn order is derived from score-card progress instead of mutable network state.
 * For a valid table state, players before the active player have exactly one more
 * filled field than the active player and everyone after them has the same count.
 * This makes turn advancement self-healing after a missed/reordered realtime event.
 */
export function deriveTurnState(players: Array<PlayerState | undefined>): DerivedTurnState {
  if (players.length === 0 || players.some(player => !player)) {
    return { ready: false, valid: false, finished: false, round: 1, turnIndex: 0, counts: [], reason: 'missing-player-state' }
  }

  const known = players as PlayerState[]
  const counts = known.map(player => filledCount(player.scoreCard))
  const finished = known.every(player => isScoreCardComplete(player.scoreCard))
  if (finished) {
    return { ready: true, valid: true, finished: true, round: Math.max(...counts, 1), turnIndex: Math.max(known.length - 1, 0), counts }
  }

  const min = Math.min(...counts)
  const max = Math.max(...counts)
  if (max - min > 1) {
    return { ready: true, valid: false, finished: false, round: min + 1, turnIndex: 0, counts, reason: 'progress-gap' }
  }

  if (max === min) {
    return { ready: true, valid: true, finished: false, round: min + 1, turnIndex: 0, counts }
  }

  // Expected form: [min+1, min+1, ..., min, min, ...]
  const firstMin = counts.findIndex(count => count === min)
  if (firstMin < 0) {
    return { ready: true, valid: false, finished: false, round: min + 1, turnIndex: 0, counts, reason: 'no-active-player' }
  }
  const beforeValid = counts.slice(0, firstMin).every(count => count === min + 1)
  const afterValid = counts.slice(firstMin).every(count => count === min)
  if (!beforeValid || !afterValid) {
    return { ready: true, valid: false, finished: false, round: min + 1, turnIndex: firstMin, counts, reason: 'out-of-order-progress' }
  }

  return { ready: true, valid: true, finished: false, round: min + 1, turnIndex: firstMin, counts }
}
