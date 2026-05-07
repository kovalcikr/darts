import prisma from '@/app/lib/db'
import type { Prisma } from '@/prisma/client'
import { STARTING_SCORE } from '@/app/lib/scoring'
import type { MatchLiveState } from './model'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

function findMatchGroup(groups: { playerId: string; _sum: { score: number | null; darts: number | null } }[], playerId: string) {
    return groups.find(g => g.playerId === playerId)
}

function findLegGroup(groups: { playerId: string; _sum: { score: number | null }; _count?: { id: number } }[], playerId: string) {
    return groups.find(g => g.playerId === playerId)
}

export async function findMatchLiveStates(matchIds: string[], tx?: PrismaTransactionClient): Promise<MatchLiveState[]> {
    if (matchIds.length === 0) {
        return []
    }
    const client = tx || prisma
    return client.matchLiveState.findMany({
        where: { matchId: { in: matchIds } },
    })
}

export async function upsertMatchLiveState(matchId: string, tournamentId: string, table: string | null, state: Omit<MatchLiveState, 'matchId' | 'tournamentId' | 'table'>, tx?: PrismaTransactionClient): Promise<MatchLiveState> {
    const client = tx || prisma
    const fullState: MatchLiveState = {
        matchId,
        tournamentId,
        table,
        ...state,
    }
    await client.matchLiveState.upsert({
        create: fullState,
        update: fullState,
        where: { matchId },
    })
    return fullState
}