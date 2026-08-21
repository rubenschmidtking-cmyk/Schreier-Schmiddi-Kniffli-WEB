import { describe, expect, it } from 'vitest'
import { emptyScoreCard, filledCount, normalizeScoreCard, scoreCategory, scoreTotals } from './scoring'

const DICE = {
  fullHouse: [2,2,5,5,5],
  drilling: [3,3,3,5,6],
  vierling: [4,4,4,4,6],
} as const

describe('Schmiddi & Schreier Dice Dash rules', () => {
  it('scores Dice Dash as 50', () => expect(scoreCategory('kniffli', [5,5,5,5,5])).toBe(50))
  it('scores small straight as 30', () => expect(scoreCategory('smallStraight', [1,2,3,4,6])).toBe(30))
  it('scores large straight as 40', () => expect(scoreCategory('largeStraight', [2,3,4,5,6])).toBe(40))
  it('counts all five dice for Drilling', () => expect(scoreCategory('threeOfAKind', [...DICE.drilling])).toBe(20))
  it('counts all five dice for Vierling', () => expect(scoreCategory('fourOfAKind', [...DICE.vierling])).toBe(22))
  it('scores all even and all odd as 15', () => {
    expect(scoreCategory('allEven', [2,4,6,2,4])).toBe(15)
    expect(scoreCategory('allOdd', [1,3,5,1,5])).toBe(15)
  })
  it('scores 2 pairs as 15 and exact 20 by dice sum', () => {
    expect(scoreCategory('twoPairs', [2,2,5,5,6])).toBe(15)
    expect(scoreCategory('twoPairs', [2,2,5,5,6], 1)).toBe(20)
    expect(scoreCategory('exact20', [2,3,4,5,6])).toBe(20)
  })
  it('adds +5 for a valid lower category scored after the first roll', () => {
    expect(scoreCategory('fullHouse', [...DICE.fullHouse], 1)).toBe(30)
    expect(scoreCategory('fullHouse', [...DICE.fullHouse], 2)).toBe(25)
    expect(scoreCategory('chance', [1,2,3,4,6], 1)).toBe(21)
  })
  it('does not add first-roll bonus to upper categories', () => {
    expect(scoreCategory('sixes', [6,6,2,3,4], 1)).toBe(12)
  })
  it('adds upper bonus at 63', () => {
    const card = emptyScoreCard()
    Object.assign(card, { ones:3, twos:6, threes:9, fours:12, fives:15, sixes:18 })
    expect(scoreTotals(card).upperSubtotal).toBe(63)
    expect(scoreTotals(card).bonus).toBe(35)
  })
})


describe('score-card hardening', () => {
  it('does not count missing or invalid fields as filled', () => {
    const card = normalizeScoreCard({ ones: 3, twos: undefined, threes: NaN, fours: -1 })
    expect(filledCount(card)).toBe(1)
    expect(card.ones).toBe(3)
    expect(card.twos).toBeNull()
    expect(card.threes).toBeNull()
    expect(card.fours).toBeNull()
  })
})
