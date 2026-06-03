import { describe, expect, test } from '@jest/globals'
import { getNextPlayer, getLegStarter } from '../leg-turn'

describe('getNextPlayer', () => {
  test('returns firstPlayer on leg 1 with no throws', () => {
    expect(getNextPlayer({
      currentLeg: 1,
      throwsByA: 0,
      throwsByB: 0,
      firstPlayer: 'pA',
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBe('pA')
  })

  test('alternates after each throw', () => {
    expect(getNextPlayer({
      currentLeg: 1,
      throwsByA: 1,
      throwsByB: 0,
      firstPlayer: 'pA',
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBe('pB')

    expect(getNextPlayer({
      currentLeg: 1,
      throwsByA: 1,
      throwsByB: 1,
      firstPlayer: 'pA',
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBe('pA')
  })

  test('returns null when firstPlayer is not set', () => {
    expect(getNextPlayer({
      currentLeg: 1,
      throwsByA: 0,
      throwsByB: 0,
      firstPlayer: null,
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBeNull()
  })

  test('handles leg 2 with same turn logic', () => {
    expect(getNextPlayer({
      currentLeg: 2,
      throwsByA: 0,
      throwsByB: 0,
      firstPlayer: 'pA',
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBe('pB')

    expect(getNextPlayer({
      currentLeg: 2,
      throwsByA: 1,
      throwsByB: 0,
      firstPlayer: 'pA',
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBe('pA')
  })

  test('counts throws, not darts', () => {
    expect(getNextPlayer({
      currentLeg: 1,
      throwsByA: 2,
      throwsByB: 1,
      firstPlayer: 'pA',
      playerAId: 'pA',
      playerBId: 'pB',
    })).toBe('pB')
  })
})

describe('getLegStarter', () => {
  test('uses the first player for odd legs and the other player for even legs', () => {
    expect(getLegStarter({
      leg: 1,
      playerAId: 'pA',
      playerBId: 'pB',
      firstPlayer: 'pA',
    })).toBe('pA')

    expect(getLegStarter({
      leg: 2,
      playerAId: 'pA',
      playerBId: 'pB',
      firstPlayer: 'pA',
    })).toBe('pB')
  })

  test('returns null when starter data is incomplete', () => {
    expect(getLegStarter({
      leg: 1,
      playerAId: 'pA',
      playerBId: 'pB',
      firstPlayer: null,
    })).toBeNull()
  })
})
