import prisma, { type PrismaTransactionClient, getPrismaClient } from "@/app/lib/db";
import type { MatchLiveState } from './model'

export async function findMatchLiveStates(matchIds: string[], tx?: PrismaTransactionClient): Promise<MatchLiveState[]> {
    if (matchIds.length === 0) {
        return []
    }
    const client = getPrismaClient(tx)
    const results = await client.matchLiveState.findMany({
        where: { matchId: { in: matchIds } },
    })
    return results as unknown as MatchLiveState[]
}

export async function storeMatchLiveState(state: MatchLiveState, tx?: PrismaTransactionClient): Promise<MatchLiveState> {
    const client = getPrismaClient(tx)
    await client.matchLiveState.upsert({
        create: state,
        update: state,
        where: { matchId: state.matchId },
    })
    return state
}