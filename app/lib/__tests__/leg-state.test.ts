import { describe, expect, test } from '@jest/globals'
import {
  calculateLegState,
  calculateThreeDartAverage,
  STARTING_SCORE,
} from '../score-entry'

describe('leg-state', () => {
  describe('calculateLegState', () => {
    test('calculates scores from throws for both players', () => {
      const result = calculateLegState({
        throws: [
          { playerId: 'pA', score: 100, darts: 3 },
          { playerId: 'pB', score: 60, darts: 3 },
          { playerId: 'pA', score: 81, darts: 3 },
        ],
        leg: 1,
        playerAId: 'pA',
        playerBId: 'pB',
        firstPlayer: 'pA',
      })

      expect(result.playerAScoreLeft).toBe(STARTING_SCORE - 181)
      expect(result.playerBScoreLeft).toBe(STARTING_SCORE - 60)
      expect(result.playerADarts).toBe(6)
      expect(result.playerBDarts).toBe(3)
    })

    test('returns zero darts when no throws exist', () => {
      const result = calculateLegState({
        throws: [],
        leg: 1,
        playerAId: 'pA',
        playerBId: 'pB',
        firstPlayer: 'pA',
      })

      expect(result.playerAScoreLeft).toBe(STARTING_SCORE)
      expect(result.playerBScoreLeft).toBe(STARTING_SCORE)
      expect(result.playerADarts).toBe(0)
      expect(result.playerBDarts).toBe(0)
    })

    test('determines next player based on throw count and first player', () => {
      const result = calculateLegState({
        throws: [{ playerId: 'pA', score: 60, darts: 3 }],
        leg: 1,
        playerAId: 'pA',
        playerBId: 'pB',
        firstPlayer: 'pA',
      })

      expect(result.nextPlayer).toBe('pB')
    })

    test('returns null nextPlayer when firstPlayer is not set', () => {
      const result = calculateLegState({
        throws: [],
        leg: 1,
        playerAId: 'pA',
        playerBId: 'pB',
        firstPlayer: null,
      })

      expect(result.nextPlayer).toBeNull()
    })

    test('uses custom starting score', () => {
      const result = calculateLegState({
        throws: [{ playerId: 'pA', score: 100, darts: 3 }],
        leg: 1,
        playerAId: 'pA',
        playerBId: 'pB',
        firstPlayer: 'pA',
        startingScore: 301,
      })

      expect(result.playerAScoreLeft).toBe(301 - 100)
      expect(result.playerBScoreLeft).toBe(301)
    })
  })

  describe('calculateThreeDartAverage', () => {
    test('returns zero when no darts thrown', () => {
      expect(calculateThreeDartAverage(0, 0)).toBe(0)
    })

    test('calculates average correctly', () => {
      expect(calculateThreeDartAverage(300, 10)).toBe(90)
      expect(calculateThreeDartAverage(321, 12)).toBe(80.25)
    })

    test('returns zero when darts is zero', () => {
      expect(calculateThreeDartAverage(100, 0)).toBe(0)
    })
  })
})