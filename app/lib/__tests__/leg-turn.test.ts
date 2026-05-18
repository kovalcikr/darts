import { describe, expect, test } from '@jest/globals'
import { getNextPlayer, getLegStarter } from '../leg-turn'

describe('leg-turn', () => {
  describe('getNextPlayer', () => {
    test('returns null when firstPlayer is null', () => {
      expect(
        getNextPlayer({
          currentLeg: 1,
          throwsByA: 0,
          throwsByB: 0,
          firstPlayer: null,
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBeNull()
    })

    test('returns other player when throwCount is odd', () => {
      expect(
        getNextPlayer({
          currentLeg: 1,
          throwsByA: 1,
          throwsByB: 0,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pB')
    })

    test('returns firstPlayer when throwCount is even', () => {
      expect(
        getNextPlayer({
          currentLeg: 1,
          throwsByA: 1,
          throwsByB: 1,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pA')
    })

    test('alternates correctly with firstPlayer as playerB', () => {
      expect(
        getNextPlayer({
          currentLeg: 1,
          throwsByA: 0,
          throwsByB: 0,
          firstPlayer: 'pB',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pB')

      expect(
        getNextPlayer({
          currentLeg: 1,
          throwsByA: 0,
          throwsByB: 1,
          firstPlayer: 'pB',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pA')
    })
  })

  describe('getLegStarter', () => {
    test('returns null when firstPlayer is null', () => {
      expect(
        getLegStarter({
          leg: 1,
          firstPlayer: null,
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBeNull()
    })

    test('returns firstPlayer for odd legs', () => {
      expect(
        getLegStarter({
          leg: 1,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pA')

      expect(
        getLegStarter({
          leg: 3,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pA')
    })

    test('returns other player for even legs', () => {
      expect(
        getLegStarter({
          leg: 2,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pB')
    })
  })
})