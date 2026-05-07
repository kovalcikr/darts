import { describe, expect, test } from '@jest/globals'
import {
  calculateLegState,
  calculateThreeDartAverage,
  getAllowedCheckoutDarts,
} from '../scoring'

describe('scoring', () => {
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

      expect(result.playerAScoreLeft).toBe(501 - 181)
      expect(result.playerBScoreLeft).toBe(501 - 60)
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

      expect(result.playerAScoreLeft).toBe(501)
      expect(result.playerBScoreLeft).toBe(501)
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
  })

  describe('getAllowedCheckoutDarts', () => {
    test('returns empty array for invalid scores', () => {
      expect(getAllowedCheckoutDarts(0)).toEqual([])
      expect(getAllowedCheckoutDarts(1)).toEqual([])
      expect(getAllowedCheckoutDarts(-5)).toEqual([])
    })

    test('returns valid checkout darts for finishable scores', () => {
      const darts170 = getAllowedCheckoutDarts(170)
      expect(darts170).toContain(3)

      const darts160 = getAllowedCheckoutDarts(160)
      expect(darts160).toContain(3)
    })

    test('checkout darts vary by score', () => {
      expect(getAllowedCheckoutDarts(100)).toContain(2)
      expect(getAllowedCheckoutDarts(50)).toContain(1)
    })
  })
})

describe('calculateLegState next player edge cases', () => {
  test('alternates correctly across multiple throws', () => {
    const throws = [
      { playerId: 'pA', score: 60, darts: 3 },
      { playerId: 'pB', score: 60, darts: 3 },
      { playerId: 'pA', score: 60, darts: 3 },
      { playerId: 'pB', score: 60, darts: 3 },
    ]

    const result = calculateLegState({
      throws,
      leg: 1,
      playerAId: 'pA',
      playerBId: 'pB',
      firstPlayer: 'pA',
    })

    expect(result.nextPlayer).toBe('pA')
  })

  test('handles leg 2 with same turn logic', () => {
    const throws = [{ playerId: 'pA', score: 60, darts: 3 }]

    const result = calculateLegState({
      throws,
      leg: 2,
      playerAId: 'pA',
      playerBId: 'pB',
      firstPlayer: 'pA',
    })

    expect(result.nextPlayer).toBe('pA')
  })
})