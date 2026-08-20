import { categories, upperCategories, type Difficulty, type PlayerState, type ScoreCategory } from './types'
import { scoreCategory } from './scoring'
import { freshDice, randomDieValue } from './game'

function weighted(category: ScoreCategory, points: number, difficulty: Difficulty) {
  let value = points
  if ((upperCategories as readonly string[]).includes(category)) {
    const face = upperCategories.indexOf(category as (typeof upperCategories)[number]) + 1
    if (face >= 4) value += difficulty === 'psycho' ? 5 : 1
  }
  if (category === 'chance') value -= difficulty === 'psycho' ? 9 : 3
  if (category === 'kniffli' && points >= 50) value += 20
  return value
}

function chooseHolds(dice: number[], open: Set<ScoreCategory>, difficulty: Difficulty): Set<number> {
  const grouped = new Map<number, number[]>()
  dice.forEach((value, i) => grouped.set(value, [...(grouped.get(value) ?? []), i]))
  if (['kniffli','fourOfAKind','threeOfAKind'].some(c => open.has(c as ScoreCategory))) {
    const best = [...grouped.values()].sort((a,b) => b.length - a.length)[0]
    if (best?.length >= 2) return new Set(best)
  }
  if (open.has('largeStraight') || open.has('smallStraight')) {
    const targets = [[1,2,3,4,5],[2,3,4,5,6]]
    const target = targets.sort((a,b) => b.filter(v => dice.includes(v)).length - a.filter(v => dice.includes(v)).length)[0]
    const seen = new Set<number>()
    const kept = dice.map((v,i) => ({v,i})).filter(({v}) => target.includes(v) && !seen.has(v) && !!seen.add(v)).map(({i}) => i)
    if (kept.length >= 3) return new Set(kept)
  }
  if (open.has('allEven')) {
    const kept = dice.map((v,i) => ({v,i})).filter(({v}) => v % 2 === 0).map(({i}) => i)
    if (kept.length >= 3) return new Set(kept)
  }
  if (open.has('allOdd')) {
    const kept = dice.map((v,i) => ({v,i})).filter(({v}) => v % 2 === 1).map(({i}) => i)
    if (kept.length >= 3) return new Set(kept)
  }
  const threshold = difficulty === 'easy' ? 5 : 4
  return new Set(dice.map((v,i) => ({v,i})).filter(({v}) => v >= threshold).map(({i}) => i))
}

export interface CpuRoundResult {
  player: PlayerState
  category: ScoreCategory
  points: number
  finalDice: number[]
  rolls: number
}

export function playCpuRound(player: PlayerState, difficulty: Difficulty): CpuRoundResult {
  let dice = freshDice().map(d => d.value)
  let held = new Set<number>()
  let rolls = 0
  const open = new Set(categories.filter(c => player.scoreCard[c] === null))
  let chosen: ScoreCategory | null = null

  while (rolls < 3 && !chosen) {
    dice = dice.map((value, i) => held.has(i) ? value : randomDieValue())
    rolls += 1
    const scored = [...open].map(category => ({ category, points: scoreCategory(category, dice, rolls) }))
    scored.sort((a,b) => weighted(b.category,b.points,difficulty) - weighted(a.category,a.points,difficulty))
    const best = scored[0]
    const firstRollBank = rolls === 1 && best.points >= (difficulty === 'easy' ? 35 : difficulty === 'normal' ? 30 : 25)
    const bank = best.points >= 40 || firstRollBank || (rolls === 2 && best.points >= (difficulty === 'easy' ? 18 : 25)) || rolls === 3
    if (bank) chosen = best.category
    else held = chooseHolds(dice, open, difficulty)
  }

  chosen ??= [...open][0]
  const points = scoreCategory(chosen, dice, rolls)
  return {
    category: chosen,
    points,
    finalDice: dice,
    rolls,
    player: { ...player, scoreCard: { ...player.scoreCard, [chosen]: points }, submitted: true, rollsUsed: rolls, dice: player.dice.map((d,i) => ({...d, value: dice[i], held: false})) }
  }
}
