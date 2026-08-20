import { categories, lowerCategories, upperCategories, type ScoreCard, type ScoreCategory } from './types'
import { UPPER_BONUS, UPPER_BONUS_THRESHOLD } from './rules'

export const FIRST_ROLL_LOWER_BONUS = 5

export function emptyScoreCard(): ScoreCard {
  return Object.fromEntries(categories.map(category => [category, null])) as ScoreCard
}

export function normalizeScoreCard(input: unknown): ScoreCard {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  return Object.fromEntries(categories.map(category => {
    const value = raw[category]
    return [category, typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : null]
  })) as ScoreCard
}

function baseScoreCategory(category: ScoreCategory, dice: number[]): number {
  if (dice.length !== 5 || dice.some(value => value < 1 || value > 6)) return 0
  const counts = new Map<number, number>()
  dice.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1))
  const countValues = [...counts.values()]
  const sum = dice.reduce((a, b) => a + b, 0)
  const unique = new Set(dice)

  switch (category) {
    case 'ones': return dice.filter(v => v === 1).reduce((a,b) => a+b, 0)
    case 'twos': return dice.filter(v => v === 2).reduce((a,b) => a+b, 0)
    case 'threes': return dice.filter(v => v === 3).reduce((a,b) => a+b, 0)
    case 'fours': return dice.filter(v => v === 4).reduce((a,b) => a+b, 0)
    case 'fives': return dice.filter(v => v === 5).reduce((a,b) => a+b, 0)
    case 'sixes': return dice.filter(v => v === 6).reduce((a,b) => a+b, 0)
    case 'twoPairs': return countValues.filter(c => c >= 2).length >= 2 ? 20 : 0
    case 'threeOfAKind': return countValues.some(c => c >= 3) ? sum : 0
    case 'fourOfAKind': return countValues.some(c => c >= 4) ? sum : 0
    case 'fullHouse': return [...countValues].sort((a,b) => a-b).join(',') === '2,3' ? 25 : 0
    case 'smallStraight': {
      const targets = [[1,2,3,4],[2,3,4,5],[3,4,5,6]]
      return targets.some(target => target.every(value => unique.has(value))) ? 30 : 0
    }
    case 'largeStraight': {
      return [1,2,3,4,5].every(v => unique.has(v)) || [2,3,4,5,6].every(v => unique.has(v)) ? 40 : 0
    }
    case 'kniffli': return countValues.includes(5) ? 50 : 0
    case 'allEven': return dice.every(v => v % 2 === 0) ? 15 : 0
    case 'allOdd': return dice.every(v => v % 2 === 1) ? 15 : 0
    case 'exact15': return sum === 15 ? 15 : 0
    case 'exact20': return sum === 20 ? 20 : 0
    case 'chance': return sum
  }
}

export function firstRollBonus(category: ScoreCategory, dice: number[], rollsUsed?: number): number {
  if (rollsUsed !== 1) return 0
  if (!(lowerCategories as readonly ScoreCategory[]).includes(category)) return 0
  return baseScoreCategory(category, dice) > 0 ? FIRST_ROLL_LOWER_BONUS : 0
}

export function scoreCategory(category: ScoreCategory, dice: number[], rollsUsed?: number): number {
  const base = baseScoreCategory(category, dice)
  if (base <= 0) return 0
  return base + firstRollBonus(category, dice, rollsUsed)
}

export function scoreTotals(card: ScoreCard) {
  const upperSubtotal = upperCategories.reduce((sum, category) => sum + (card[category] ?? 0), 0)
  const bonus = upperSubtotal >= UPPER_BONUS_THRESHOLD ? UPPER_BONUS : 0
  const lowerTotal = lowerCategories.reduce((sum, category) => sum + (card[category] ?? 0), 0)
  return { upperSubtotal, bonus, upperTotal: upperSubtotal + bonus, lowerTotal, total: upperSubtotal + bonus + lowerTotal }
}

export function filledCount(card: ScoreCard) {
  return categories.filter(category => typeof card?.[category] === 'number' && Number.isFinite(card[category] as number)).length
}

export function isScoreCardComplete(card: ScoreCard) {
  return filledCount(card) === categories.length
}
