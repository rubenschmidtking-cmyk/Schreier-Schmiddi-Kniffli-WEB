import type { Die, PlayerState, ScoreCategory } from './types'
import { emptyScoreCard, scoreCategory } from './scoring'

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function randomDieValue(): number {
  if(globalThis.crypto?.getRandomValues){const value=new Uint32Array(1);globalThis.crypto.getRandomValues(value);return (value[0] % 6) + 1}
  return Math.floor(Math.random() * 6) + 1
}

export function freshDice(): Die[] {
  return Array.from({ length: 5 }, () => ({ id: uid(), value: 1, held: false }))
}

export function createPlayer(name: string): PlayerState {
  return { id: uid(), name, scoreCard: emptyScoreCard(), dice: freshDice(), rollsUsed: 0, submitted: false }
}

export function rollDice(player: PlayerState): PlayerState {
  if (player.rollsUsed >= 3 || player.submitted) return player
  return {
    ...player,
    rollsUsed: player.rollsUsed + 1,
    dice: player.dice.map(die => die.held ? die : { ...die, value: randomDieValue() }),
  }
}

export function toggleDie(player: PlayerState, dieId: string): PlayerState {
  if (player.rollsUsed === 0 || player.submitted) return player
  return { ...player, dice: player.dice.map(die => die.id === dieId ? { ...die, held: !die.held } : die) }
}

export function submitCategory(player: PlayerState, category: ScoreCategory): { player: PlayerState; points: number } {
  if (player.rollsUsed === 0 || player.submitted || typeof player.scoreCard[category] === 'number') return { player, points: 0 }
  const points = scoreCategory(category, player.dice.map(d => d.value), player.rollsUsed)
  return {
    points,
    player: { ...player, submitted: true, scoreCard: { ...player.scoreCard, [category]: points } }
  }
}

export function resetRound(player: PlayerState): PlayerState {
  return { ...player, dice: freshDice(), rollsUsed: 0, submitted: false }
}
