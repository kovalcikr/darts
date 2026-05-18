import { describe, expect, test } from '@jest/globals'
import { buildMatchLiveState } from '../builder'
import type { MatchForLiveState, LegTotalsGroup, MatchTotalsGroup, LastThrow } from '../builder'

describe('buildMatchLiveState', () => {
    const match: MatchForLiveState = {
        id: 'm1',
        tournamentId: 't1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        firstPlayer: 'pA',
    }

    test('calculates scores from throw totals', () => {
        const matchTotals: MatchTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 160, darts: 6 } },
            { playerId: 'pB', _sum: { score: 50, darts: 3 } },
        ]
        const legTotals: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 100 }, _count: { id: 1 } },
            { playerId: 'pB', _sum: { score: 60 }, _count: { id: 1 } },
        ]
        const lastThrows: LastThrow[] = []

        const state = buildMatchLiveState(match, 'table1', matchTotals, legTotals, lastThrows)

        expect(state.playerAScoreLeft).toBe(401) // 501 - 100
        expect(state.playerBScoreLeft).toBe(441) // 501 - 60
        expect(state.playerATotalScore).toBe(160)
        expect(state.playerBTotalScore).toBe(50)
        expect(state.playerATotalDarts).toBe(6)
        expect(state.playerBTotalDarts).toBe(3)
    })

    test('determines active player based on throw count and first player', () => {
        const matchTotals: MatchTotalsGroup[] = []
        const legTotals: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 0 }, _count: { id: 0 } },
            { playerId: 'pB', _sum: { score: 0 }, _count: { id: 0 } },
        ]
        const lastThrows: LastThrow[] = []

        // 1 throw in leg - next should be pB (alternating from pA)
        const oneThrow: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 60 }, _count: { id: 1 } },
            { playerId: 'pB', _sum: { score: 0 }, _count: { id: 0 } },
        ]
        const state1 = buildMatchLiveState(match, null, matchTotals, oneThrow, lastThrows)
        expect(state1.activePlayerId).toBe('pB')

        // 2 throws in leg - next should be pA
        const twoThrows: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 60 }, _count: { id: 1 } },
            { playerId: 'pB', _sum: { score: 60 }, _count: { id: 1 } },
        ]
        const state2 = buildMatchLiveState(match, null, matchTotals, twoThrows, lastThrows)
        expect(state2.activePlayerId).toBe('pA')
    })

    test('returns null active player when firstPlayer is not set', () => {
        const matchNoFirst: MatchForLiveState = { ...match, firstPlayer: null }
        const matchTotals: MatchTotalsGroup[] = []
        const legTotals: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 0 }, _count: { id: 0 } },
            { playerId: 'pB', _sum: { score: 0 }, _count: { id: 0 } },
        ]
        const lastThrows: LastThrow[] = []

        const state = buildMatchLiveState(matchNoFirst, null, matchTotals, legTotals, lastThrows)

        expect(state.activePlayerId).toBeNull()
    })

    test('handles leg progression correctly', () => {
        const matchLeg2: MatchForLiveState = { ...match, playerALegs: 1, playerBlegs: 0 }
        const matchTotals: MatchTotalsGroup[] = []
        const legTotals: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 0 }, _count: { id: 0 } },
            { playerId: 'pB', _sum: { score: 0 }, _count: { id: 0 } },
        ]
        const lastThrows: LastThrow[] = []

        const state = buildMatchLiveState(matchLeg2, null, matchTotals, legTotals, lastThrows)

        expect(state.leg).toBe(2)
    })

    test('maps last throws preserving checkout flag', () => {
        const matchTotals: MatchTotalsGroup[] = []
        const legTotals: LegTotalsGroup[] = [
            { playerId: 'pA', _sum: { score: 0 }, _count: { id: 0 } },
            { playerId: 'pB', _sum: { score: 0 }, _count: { id: 0 } },
        ]
        const lastThrows: LastThrow[] = [
            { playerId: 'pB', score: 60, darts: 3, checkout: false, leg: 1 },
            { playerId: 'pA', score: 180, darts: 3, checkout: true, leg: 1 },
        ]

        const state = buildMatchLiveState(match, null, matchTotals, legTotals, lastThrows)

        expect(state.lastThrows).toEqual(lastThrows)
    })

    test('handles empty totals gracefully', () => {
        const matchTotals: MatchTotalsGroup[] = []
        const legTotals: LegTotalsGroup[] = []
        const lastThrows: LastThrow[] = []

        const state = buildMatchLiveState(match, null, matchTotals, legTotals, lastThrows)

        expect(state.playerAScoreLeft).toBe(501)
        expect(state.playerBScoreLeft).toBe(501)
        expect(state.playerATotalScore).toBe(0)
        expect(state.playerBTotalScore).toBe(0)
        expect(state.playerATotalDarts).toBe(0)
        expect(state.playerBTotalDarts).toBe(0)
        expect(state.activePlayerId).toBe('pA') // first player
    })
})