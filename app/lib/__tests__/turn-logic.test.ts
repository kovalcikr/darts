import { describe, expect, test } from '@jest/globals'
import { getNextPlayer, getLegStarter } from '../score-entry'

describe('turn-logic', () => {
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

    test('leg number affects next player calculation', () => {
      // Even leg number (2) + even throw count (4) = other player
      // (2 + 4) % 2 = 0, so returns non-first player
      expect(
        getNextPlayer({
          currentLeg: 2,
          throwsByA: 2,
          throwsByB: 2,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pB')

      // Odd leg (1) + even throw count (3) = other player
      // (1 + 3) % 2 = 0, so returns non-first player
      expect(
        getNextPlayer({
          currentLeg: 1,
          throwsByA: 2,
          throwsByB: 1,
          firstPlayer: 'pA',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pB')
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

    test('handles firstPlayer as playerB', () => {
      expect(
        getLegStarter({
          leg: 1,
          firstPlayer: 'pB',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pB')

      expect(
        getLegStarter({
          leg: 2,
          firstPlayer: 'pB',
          playerAId: 'pA',
          playerBId: 'pB',
        })
      ).toBe('pA')
    })
  })
})