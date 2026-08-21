export const upperCategories = ['ones','twos','threes','fours','fives','sixes'] as const
export const lowerCategories = ['twoPairs','threeOfAKind','fourOfAKind','fullHouse','smallStraight','largeStraight','kniffli','allEven','allOdd','exact20','chance'] as const
export const categories = [...upperCategories, ...lowerCategories] as const
export type ScoreCategory = typeof categories[number]
export type Difficulty = 'easy' | 'normal' | 'psycho'
export type GameMode = 'cpu' | 'online' | 'local'

export type ScoreCard = Record<ScoreCategory, number | null>

export interface Die {
  id: string
  value: number
  held: boolean
}

export interface PlayerState {
  id: string
  name: string
  scoreCard: ScoreCard
  dice: Die[]
  rollsUsed: number
  submitted: boolean
}

export interface RemotePlayerSnapshot {
  id: string
  name: string
  scoreCard: ScoreCard
  dice: Die[]
  rollsUsed: number
  submitted: boolean
}

export interface Settings {
  sound: boolean
  shakeToRoll: boolean
  playerName: string
  cpuDifficulty: Difficulty
}
