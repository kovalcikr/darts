import prisma from '@/app/lib/db'
import type { Prisma } from '@/prisma/client'
import type { MatchLiveState } from './model'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

export async function findMatchLiveStates(matchIds: string[], tx?: PrismaTransactionClient): Promise<MatchLiveState[]> {
    if (matchIds.length === 0) {
        return []
    }
    const client = tx || prisma
    const results = await client.matchLiveState.findMany({
        where: { matchId: { in: matchIds } },
    })
    return results as unknown as MatchLiveState[]
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