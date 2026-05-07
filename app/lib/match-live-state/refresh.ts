'use server'

import prisma from '@/app/lib/db'
import type { Prisma } from '@/prisma/client'
import { STARTING_SCORE, getNextPlayer } from '@/app/lib/scoring'
import type { MatchLiveState } from './model'
import { storeMatchLiveState } from './repository'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

export async function refreshMatchLiveState(
    matchId: string,
    table?: string | null,
    tx?: PrismaTransactionClient
): Promise<MatchLiveState | null> {
    const client = tx || prisma

    const match = await client.match.findUnique({
        where: { id: matchId },
    })

    if (!match?.tournamentId) {
        return null
    }

    const leg = match.playerALegs + match.playerBlegs + 1

    const [matchTotals, legTotals, lastThrows] = await Promise.all([
        client.playerThrow.groupBy({
            by: ['playerId'],
            _sum: { score: true, darts: true },
            where: { matchId, undoneAt: null },
        }),
        client.playerThrow.groupBy({
            by: ['playerId'],
            _sum: { score: true },
            _count: { id: true },
            where: { matchId, leg, playerId: { in: [match.playerAId, match.playerBId] }, undoneAt: null },
        }),
        client.playerThrow.findMany({
            where: { matchId, leg, undoneAt: null },
            orderBy: { time: 'desc' },
            take: 6,
            select: { playerId: true, score: true, darts: true, checkout: true, leg: true },
        }),
    ]) as [
        { playerId: string; _sum: { score: number | null; darts: number | null } }[],
        { playerId: string; _sum: { score: number | null }; _count: { id: number } }[],
        { playerId: string; score: number; darts: number; checkout: boolean; leg: number }[]
    ]

    const findMatchGroup = (groups: { playerId: string; _sum: { score: number | null; darts: number | null } }[], playerId: string) =>
        groups.find(g => g.playerId === playerId)

    const findLegGroup = (groups: { playerId: string; _sum: { score: number | null }; _count?: { id: number } }[], playerId: string) =>
        groups.find(g => g.playerId === playerId)

    const playerAMatchTotals = findMatchGroup(matchTotals, match.playerAId)
    const playerBMatchTotals = findMatchGroup(matchTotals, match.playerBId)
    const playerALegTotals = findLegGroup(legTotals, match.playerAId)
    const playerBLegTotals = findLegGroup(legTotals, match.playerBId)

    const throwCount = (playerALegTotals?._count?.id ?? 0) + (playerBLegTotals?._count?.id ?? 0)
    const startingPlayerId = match.firstPlayer

    const activePlayerId = getNextPlayer({
      leg,
      throwCount,
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
        startingPlayerId,
        lastThrows: lastThrowsData,
    }

    return storeMatchLiveState(state, tx)
}