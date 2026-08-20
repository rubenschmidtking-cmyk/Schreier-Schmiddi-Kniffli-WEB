import { describe, expect, it } from 'vitest'
import { createPlayer } from './game'
import { categories } from './types'
import { deriveTurnState } from './turnState'

function playerWithFilled(name: string, count: number) {
  const player = createPlayer(name)
  for (const category of categories.slice(0, count)) player.scoreCard[category] = 1
  return player
}

describe('deriveTurnState', () => {
  it('starts with player 1', () => {
    const state = deriveTurnState([playerWithFilled('A',0), playerWithFilled('B',0)])
    expect(state).toMatchObject({ ready:true, valid:true, finished:false, round:1, turnIndex:0 })
  })
  it('moves to the next player when the previous score is stored', () => {
    const state = deriveTurnState([playerWithFilled('A',1), playerWithFilled('B',0), playerWithFilled('C',0)])
    expect(state).toMatchObject({ round:1, turnIndex:1, valid:true })
  })
  it('starts a new table round after everyone scored', () => {
    const state = deriveTurnState([playerWithFilled('A',1), playerWithFilled('B',1), playerWithFilled('C',1)])
    expect(state).toMatchObject({ round:2, turnIndex:0, valid:true })
  })
  it('detects a stale/out-of-order snapshot instead of inventing a turn', () => {
    const state = deriveTurnState([playerWithFilled('A',2), playerWithFilled('B',1), playerWithFilled('C',2)])
    expect(state.valid).toBe(false)
  })
  it('finishes only when all scorecards are complete', () => {
    const n = categories.length
    const state = deriveTurnState([playerWithFilled('A',n), playerWithFilled('B',n)])
    expect(state.finished).toBe(true)
  })
})
