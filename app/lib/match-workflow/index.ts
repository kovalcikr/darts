'use server'

import { revalidatePath, revalidateTag } from "next/cache"
import prisma from "@/app/lib/db"
import type { Prisma } from "@/prisma/client"
import { 
  aggregatePlayerThrow,
  createPlayerThrow,
  updateMatchLegs,
  decrementMatchLegs,
  findLastThrow as findLastThrowData,
  findPreviousLegLastThrow,
  invalidateRedoableThrows,
  markPlayerThrowUndone,
  findRedoableThrow,
  restorePlayerThrow,
  findMatch,
  updateMatchFirstPlayer,
} from "@/app/lib/data"
import { refreshMatchLiveState } from "@/app/lib/match-live-state"
import { setScore } from "@/app/lib/cuescore"
import { getAllowedCheckoutDarts } from "@/app/lib/scoring"

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

const STARTING_SCORE = 501

async function revalidateScoreboard(table: string) {
  revalidatePath('/tables/[table]', 'page')
  const cacheTag = `match${table}`
  revalidateTag(cacheTag, 'max')
}

export async function recordThrow(
  params: {
    tournamentId: string
    matchId: string
    table: string
    leg: number
    playerId: string
    score: number
    dartsCount: number
  }
): Promise<void> {
  const { tournamentId, matchId, table, leg, playerId, score, dartsCount } = params
  
  let needScoreSync = false
  let syncMatch: { tournamentId: string; id: string; playerALegs: number; playerBlegs: number } | null = null
  
  await prisma.$transaction(async (tx) => {
    const currentScore = await aggregatePlayerThrow(matchId, leg, playerId, tx)
    const previousScore = currentScore._sum.score ?? 0
    const nextScore = previousScore + score
    
    if (nextScore > STARTING_SCORE) {
      throw new Error('Bust')
    }
    
    let closeLeg = false
    if (nextScore === STARTING_SCORE) {
      const remainingScore = STARTING_SCORE - previousScore
      if (!getAllowedCheckoutDarts(remainingScore).includes(dartsCount as 1 | 2 | 3)) {
        throw new Error('Invalid checkout darts count')
      }
      closeLeg = true
    }
    
    await invalidateRedoableThrows(matchId, tx)
    await createPlayerThrow(tournamentId, matchId, leg, playerId, score, dartsCount, closeLeg, tx)
    
    if (closeLeg) {
      syncMatch = await findMatch(matchId, tx)
      syncMatch = await updateMatchLegs(
        matchId,
        syncMatch.playerAId,
        playerId,
        syncMatch.playerALegs,
        syncMatch.playerBlegs,
        syncMatch.runTo,
        tx
      )
      needScoreSync = true
    }
    
    await refreshMatchLiveState(matchId, table, tx)
  })
  
  if (needScoreSync && syncMatch) {
    await setScore(
      syncMatch.tournamentId,
      syncMatch.id,
      syncMatch.playerALegs,
      syncMatch.playerBlegs
    )
  }
  
  await revalidateScoreboard(table)
}

export async function undoLastThrow(
  params: {
    matchId: string
    table: string
    leg: number
  }
): Promise<void> {
  const { matchId, table, leg } = params
  
  let needScoreSync = false
  let syncMatch: { tournamentId: string; id: string; playerALegs: number; playerBlegs: number } | null = null
  
  await prisma.$transaction(async (tx) => {
    const lastThrow = await findLastThrowData(matchId, leg, undefined, tx)
    
    if (!lastThrow) {
      const previousLegLastThrow = await findPreviousLegLastThrow(matchId, leg, tx)
      
      if (previousLegLastThrow) {
        await markPlayerThrowUndone(previousLegLastThrow.id, tx)
        syncMatch = await findMatch(matchId, tx)
        syncMatch = await decrementMatchLegs(
          matchId,
          syncMatch.playerAId,
          previousLegLastThrow.playerId,
          syncMatch.playerALegs,
          syncMatch.playerBlegs,
          syncMatch.runTo,
          tx
        )
        needScoreSync = true
      } else {
        await updateMatchFirstPlayer(matchId, null, tx)
      }
    } else {
      await markPlayerThrowUndone(lastThrow.id, tx)
    }
    
    await refreshMatchLiveState(matchId, table, tx)
  })
  
  if (needScoreSync && syncMatch) {
    await setScore(
      syncMatch.tournamentId,
      syncMatch.id,
      syncMatch.playerALegs,
      syncMatch.playerBlegs
    )
  }
  
  await revalidateScoreboard(table)
}

export async function redoThrow(
  params: {
    matchId: string
    table: string
    leg: number
  }
): Promise<void> {
  const { matchId, table, leg } = params
  
  let needScoreSync = false
  let syncMatch: { tournamentId: string; id: string; playerALegs: number; playerBlegs: number } | null = null
  
  await prisma.$transaction(async (tx) => {
    const throwToRedo = await findRedoableThrow(matchId, tx)
    if (!throwToRedo) return
    
    const restoredThrow = await restorePlayerThrow(throwToRedo.id, tx)
    
    if (restoredThrow.checkout) {
      syncMatch = await findMatch(matchId, tx)
      syncMatch = await updateMatchLegs(
        matchId,
        syncMatch.playerAId,
        restoredThrow.playerId,
        syncMatch.playerALegs,
        syncMatch.playerBlegs,
        syncMatch.runTo,
        tx
      )
      needScoreSync = true
    }
    
    await refreshMatchLiveState(matchId, table, tx)
  })
  
  if (needScoreSync && syncMatch) {
    await setScore(
      syncMatch.tournamentId,
      syncMatch.id,
      syncMatch.playerALegs,
      syncMatch.playerBlegs
    )
  }
  
  await revalidateScoreboard(table)
}