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

export async function storeMatchLiveState(state: MatchLiveState, tx?: PrismaTransactionClient): Promise<MatchLiveState> {
    const client = tx || prisma
    await client.matchLiveState.upsert({
        create: state,
        update: state,
        where: { matchId: state.matchId },
    })
    return state
}