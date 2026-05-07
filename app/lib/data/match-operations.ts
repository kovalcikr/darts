import 'server-only'
import type { Prisma } from '@/prisma/client'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

interface SyncedMatchLegState {
    playerALegs: number
    playerBlegs: number
    isComplete: boolean
}

export function getSyncedMatchLegState(match: {
    raceTo?: unknown
    runTo?: unknown
    scoreA?: unknown
    scoreB?: unknown
}): SyncedMatchLegState | null {
    const runTo = Number(match.raceTo ?? match.runTo);
    const playerALegs = Number(match.scoreA);
    const playerBlegs = Number(match.scoreB);

    if (!Number.isInteger(runTo) || !Number.isInteger(playerALegs) || !Number.isInteger(playerBlegs)) {
        return null;
    }

    const isComplete = playerALegs >= runTo || playerBlegs >= runTo;

    return {
        playerALegs,
        playerBlegs,
        isComplete,
    };
}