import { categories, type ScoreCategory } from './types'

export const categoryMeta: Record<ScoreCategory, { title: string; hint?: string; description: string }> = {
  ones: { title: 'Einser', description: 'Summe aller Einser' },
  twos: { title: 'Zweier', description: 'Summe aller Zweier' },
  threes: { title: 'Dreier', description: 'Summe aller Dreier' },
  fours: { title: 'Vierer', description: 'Summe aller Vierer' },
  fives: { title: 'Fünfer', description: 'Summe aller Fünfer' },
  sixes: { title: 'Sechser', description: 'Summe aller Sechser' },
  twoPairs: { title: '2 Paare', hint: '15', description: 'Zwei verschiedene Paare' },
  threeOfAKind: { title: 'Drilling', hint: 'Σ', description: 'Mindestens drei gleiche · alle fünf Augen zählen' },
  fourOfAKind: { title: 'Vierling', hint: 'Σ', description: 'Mindestens vier gleiche · alle fünf Augen zählen' },
  fullHouse: { title: 'Full House', hint: '25', description: 'Ein Paar plus ein Drilling' },
  smallStraight: { title: 'Kleine Straße', hint: '30', description: 'Vier aufeinanderfolgende Zahlen' },
  largeStraight: { title: 'Große Straße', hint: '40', description: '1–5 oder 2–6' },
  kniffli: { title: 'Dice Dash', hint: '50', description: 'Fünf gleiche Würfel' },
  allEven: { title: 'Alle gerade', hint: '15', description: 'Alle fünf Würfel sind 2, 4 oder 6' },
  allOdd: { title: 'Alle ungerade', hint: '15', description: 'Alle fünf Würfel sind 1, 3 oder 5' },
  exact20: { title: 'Exakter Wurf 20', hint: '20', description: 'Augensumme exakt 20' },
  chance: { title: 'Chance', hint: 'Σ', description: 'Summe aller Würfel' },
}

export const TOTAL_ROUNDS = categories.length
export const UPPER_BONUS_THRESHOLD = 63
export const UPPER_BONUS = 35
