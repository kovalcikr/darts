'use server'

import prisma from '@/app/lib/db'
import type { Prisma } from '@/prisma/client'
import type { MatchLiveState } from './model'
import { buildMatchLiveState, type MatchForLiveState, type LegTotalsGroup, type MatchTotalsGroup, type LastThrow } from './builder'

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
            where: { matchId, leg: match.playerALegs + match.playerBlegs + 1, playerId: { in: [match.playerAId, match.playerBId] }, undoneAt: null },
        }),
        client.playerThrow.findMany({
            where: { matchId, leg: match.playerALegs + match.playerBlegs + 1, undoneAt: null },
            orderBy: { time: 'desc' },
            take: 6,
            select: { playerId: true, score: true, darts: true, checkout: true, leg: true },
        }),
    ])

    const matchData: MatchForLiveState = {
        id: match.id,
        tournamentId: match.tournamentId,
        playerAId: match.playerAId,
        playerBId: match.playerBId,
        playerALegs: match.playerALegs,
        playerBlegs: match.playerBlegs,
        firstPlayer: match.firstPlayer,
    }

    const lastThrowsData: LastThrow[] = lastThrows.map(t => ({
        playerId: t.playerId,
        score: t.score,
        darts: t.darts,
        checkout: t.checkout,
        leg: t.leg,
    }))

    const state = buildMatchLiveState(matchData, table, matchTotals as MatchTotalsGroup[], legTotals as LegTotalsGroup[], lastThrowsData)

    await client.matchLiveState.upsert({
        create: state,
        update: state,
        where: { matchId: match.id },
    })

    return state
}