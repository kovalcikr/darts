import type { MatchLiveState } from './model'
import { STARTING_SCORE } from '../scoring'
import { getNextPlayer } from '../leg-turn'

export type MatchForLiveState = {
    id: string
    tournamentId: string | null
    playerAId: string
    playerBId: string
    playerALegs: number
    playerBlegs: number
    firstPlayer: string | null
}

export type MatchTotalsGroup = {
    playerId: string
    _sum: { score: number | null; darts: number | null }
}

export type LegTotalsGroup = {
    playerId: string
    _sum: { score: number | null }
    _count?: { id: number }
}

export type LastThrow = {
    playerId: string
    score: number
    darts: number
    checkout: boolean
    leg: number
}

function findMatchGroup(groups: MatchTotalsGroup[], playerId: string) {
    return groups.find(g => g.playerId === playerId)
}

function findLegGroup(groups: LegTotalsGroup[], playerId: string) {
    return groups.find(g => g.playerId === playerId)
}

export function buildMatchLiveState(
    match: MatchForLiveState,
    table: string | null | undefined,
    matchTotals: MatchTotalsGroup[],
    legTotals: LegTotalsGroup[],
    lastThrows: LastThrow[]
): MatchLiveState {
    const leg = match.playerALegs + match.playerBlegs + 1

    const playerAMatchTotals = findMatchGroup(matchTotals, match.playerAId)
    const playerBMatchTotals = findMatchGroup(matchTotals, match.playerBId)
    const playerALegTotals = findLegGroup(legTotals, match.playerAId)
    const playerBLegTotals = findLegGroup(legTotals, match.playerBId)

    const throwCount = (playerALegTotals?._count?.id ?? 0) + (playerBLegTotals?._count?.id ?? 0)

    const activePlayerId = getNextPlayer({
        currentLeg: leg,
        throwsByA: playerALegTotals?._count?.id ?? 0,
        throwsByB: playerBLegTotals?._count?.id ?? 0,
        firstPlayer: match.firstPlayer,
        playerAId: match.playerAId,
        playerBId: match.playerBId,
    })

    const lastThrowsData = lastThrows.map(t => ({
        playerId: t.playerId,
        score: t.score,
        darts: t.darts,
        checkout: t.checkout,
        leg: t.leg,
    }))

    const state: MatchLiveState = {
        matchId: match.id,
        tournamentId: match.tournamentId,
        table: table ?? null,
        leg,
        playerAScoreLeft: STARTING_SCORE - (playerALegTotals?._sum.score ?? 0),
        playerBScoreLeft: STARTING_SCORE - (playerBLegTotals?._sum.score ?? 0),
        playerATotalScore: playerAMatchTotals?._sum.score ?? 0,
        playerBTotalScore: playerBMatchTotals?._sum.score ?? 0,
        playerATotalDarts: playerAMatchTotals?._sum.darts ?? 0,
        playerBTotalDarts: playerBMatchTotals?._sum.darts ?? 0,
        activePlayerId,
        startingPlayerId: match.firstPlayer,
        lastThrows: lastThrowsData,
    }

    return state
}