import 'server-only'
import prisma from '../db'
import type { Prisma } from '@/prisma/client'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

export type MatchWithTournament = {
  id: string
  tournamentId: string
  playerAId: string
  playerBId: string
  playerALegs: number
  playerBlegs: number
  runTo: number
  firstPlayer: string | null
}

export type RecordThrowParams = {
  matchId: string
  tournamentId: string
  leg: number
  playerId: string
  score: number
  darts: number
  table?: string
}

export type LegThrows = Array<{
  playerId: string
  score: number
  darts: number
  checkout: boolean
}>

export type MatchState = {
  match: MatchWithTournament
  currentLeg: number
  nextPlayer: string | null
  startingPlayerId: string | null
  scores: {
    playerAScoreLeft: number
    playerBScoreLeft: number
    playerADarts: number
    playerBDarts: number
  }
  averages: { playerA: number; playerB: number }
}

export class MatchRepository {
  private client: PrismaTransactionClient | typeof prisma

  constructor(client?: PrismaTransactionClient) {
    this.client = client ?? prisma
  }

  static async runInTransaction<T>(fn: (repo: MatchRepository) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      const repo = new MatchRepository(tx as PrismaTransactionClient)
      return fn(repo)
    })
  }

  async getMatch(matchId: string): Promise<MatchWithTournament | null> {
    const match = await this.client.match.findUnique({
      where: { id: matchId },
    })
    if (!match) return null
    return match as MatchWithTournament
  }

  async recordThrow(params: RecordThrowParams): Promise<{ updatedMatch: MatchWithTournament; completedLeg: boolean }> {
    const { matchId, tournamentId, leg, playerId, score, darts, table: _table } = params

    // Get current score for this leg/player
    const currentScore = await this.client.playerThrow.aggregate({
      _sum: { score: true },
      where: {
        matchId,
        leg,
        playerId,
        undoneAt: null,
      },
    })

    const previousScore = currentScore._sum.score ?? 0
    const nextScore = previousScore + score
    const STARTING_SCORE = 501

    if (nextScore > STARTING_SCORE) {
      throw new Error('Bust')
    }

    let closeLeg = false
    if (nextScore === STARTING_SCORE) {
      closeLeg = true
    }

    // Invalidate redoable throws
    await this.client.playerThrow.updateMany({
      where: {
        matchId,
        undoneAt: { not: null },
        redoInvalidatedAt: null,
      },
      data: { redoInvalidatedAt: new Date() },
    })

    // Create the throw
    await this.client.playerThrow.create({
      data: {
        tournamentId,
        matchId,
        leg,
        playerId,
        score,
        darts,
        checkout: closeLeg,
      },
    })

    let updatedMatch: MatchWithTournament = await this.client.match.findUnique({
      where: { id: matchId },
    }) as MatchWithTournament

    if (closeLeg) {
      // Update the leg count
      const isPlayerA = updatedMatch.playerAId === playerId
      const newPlayerALegs = isPlayerA ? updatedMatch.playerALegs + 1 : updatedMatch.playerALegs
      const newPlayerBlegs = isPlayerA ? updatedMatch.playerBlegs : updatedMatch.playerBlegs + 1

      updatedMatch = await this.client.match.update({
        where: { id: matchId },
        data: {
          playerALegs: newPlayerALegs,
          playerBlegs: newPlayerBlegs,
          isComplete: newPlayerALegs >= updatedMatch.runTo || newPlayerBlegs >= updatedMatch.runTo,
        },
      }) as MatchWithTournament
    }

    return { updatedMatch, completedLeg: closeLeg }
  }

  async undoThrow(matchId: string, leg: number): Promise<void> {
    // Find the last throw in current leg
    const lastThrow = await this.client.playerThrow.findFirst({
      where: {
        matchId,
        leg,
        undoneAt: null,
      },
      orderBy: { time: 'desc' },
    })

    if (!lastThrow) {
      // No throws in current leg - try to reopen previous leg
      const match = await this.client.match.findUnique({
        where: { id: matchId },
      })

      if (!match) {
        throw new Error(`Match ${matchId} not found`)
      }

      const previousLegLastThrow = await this.client.playerThrow.findFirst({
        where: {
          matchId,
          leg: leg - 1,
          undoneAt: null,
        },
        orderBy: { time: 'desc' },
      })

      if (!previousLegLastThrow) {
        // No throws in previous leg either - reset starting player
        await this.client.match.update({
          where: { id: matchId },
          data: { firstPlayer: null },
        })
        return
      }

      // Undo the last throw of previous leg
      await this.client.playerThrow.update({
        where: { id: previousLegLastThrow.id },
        data: {
          undoneAt: new Date(),
          redoInvalidatedAt: null,
        },
      })

      // Decrement leg count
      const isPlayerA = match.playerAId === previousLegLastThrow.playerId
      const newPlayerALegs = isPlayerA ? match.playerALegs - 1 : match.playerALegs
      const newPlayerBlegs = isPlayerA ? match.playerBlegs : match.playerBlegs - 1

      await this.client.match.update({
        where: { id: matchId },
        data: {
          playerALegs: newPlayerALegs,
          playerBlegs: newPlayerBlegs,
        },
      })
      return
    }

    // Undo the last throw in current leg
    await this.client.playerThrow.update({
      where: { id: lastThrow.id },
      data: {
        undoneAt: new Date(),
        redoInvalidatedAt: null,
      },
    })
  }

  async redoThrow(matchId: string): Promise<{ updatedMatch: MatchWithTournament | null; completedLeg: boolean }> {
    // Find the redoable throw
    const throwToRedo = await this.client.playerThrow.findFirst({
      where: {
        matchId,
        undoneAt: { not: null },
        redoInvalidatedAt: null,
      },
      orderBy: [{ undoneAt: 'desc' }, { time: 'desc' }],
    })

    if (!throwToRedo) {
      return { updatedMatch: null, completedLeg: false }
    }

    // Restore the throw
    await this.client.playerThrow.update({
      where: { id: throwToRedo.id },
      data: {
        undoneAt: null,
        redoInvalidatedAt: null,
      },
    })

    // If it was a checkout throw, re-close the leg
    if (!throwToRedo.checkout) {
      return { updatedMatch: null, completedLeg: false }
    }

    const match = await this.client.match.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      return { updatedMatch: null, completedLeg: false }
    }

    const isPlayerA = match.playerAId === throwToRedo.playerId
    const newPlayerALegs = isPlayerA ? match.playerALegs + 1 : match.playerALegs
    const newPlayerBlegs = isPlayerA ? match.playerBlegs : match.playerBlegs + 1

    const updatedMatch = await this.client.match.update({
      where: { id: matchId },
      data: {
        playerALegs: newPlayerALegs,
        playerBlegs: newPlayerBlegs,
        isComplete: newPlayerALegs >= match.runTo || newPlayerBlegs >= match.runTo,
      },
    })

    return { updatedMatch: updatedMatch as MatchWithTournament, completedLeg: true }
  }

  async getLegThrows(matchId: string, leg: number, playerAId: string, playerBId: string): Promise<LegThrows> {
    const throws = await this.client.playerThrow.findMany({
      where: {
        matchId,
        leg,
        playerId: { in: [playerAId, playerBId] },
        undoneAt: null,
      },
      select: {
        playerId: true,
        score: true,
        darts: true,
        checkout: true,
      },
      orderBy: { time: 'asc' },
    })
    return throws as LegThrows
  }

  async getMatchState(matchId: string): Promise<MatchState | null> {
    const match = await this.getMatch(matchId)
    if (!match) return null

    const currentLeg = match.playerALegs + match.playerBlegs + 1
    const STARTING_SCORE = 501

    const throws = await this.getLegThrows(matchId, currentLeg, match.playerAId, match.playerBId)

    const playerAThrows = throws.filter(t => t.playerId === match.playerAId)
    const playerBThrows = throws.filter(t => t.playerId === match.playerBId)

    const playerAScore = playerAThrows.reduce((s, t) => s + t.score, 0)
    const playerBScore = playerBThrows.reduce((s, t) => s + t.score, 0)
    const playerADarts = playerAThrows.reduce((s, t) => s + t.darts, 0)
    const playerBDarts = playerBThrows.reduce((s, t) => s + t.darts, 0)

    // Calculate next player using turn order logic
    const turnCount = playerAThrows.length + playerBThrows.length
    const nextPlayer = currentLeg % 2 === 1
      ? (turnCount % 2 === 0 ? match.firstPlayer : match.firstPlayer === match.playerAId ? match.playerBId : match.playerAId)
      : (turnCount % 2 === 1 ? match.firstPlayer : match.firstPlayer === match.playerAId ? match.playerBId : match.playerAId)

    // Get match averages
    const [playerAAggregates, playerBAggregates] = await Promise.all([
      this.client.playerThrow.aggregate({
        _sum: { score: true, darts: true },
        where: { matchId, playerId: match.playerAId, undoneAt: null },
      }),
      this.client.playerThrow.aggregate({
        _sum: { score: true, darts: true },
        where: { matchId, playerId: match.playerBId, undoneAt: null },
      }),
    ])

    const calculateAverage = (score: number | null, darts: number | null) => 
      darts ? Math.round((score ?? 0) / darts * 3 * 100) / 100 : 0

    return {
      match,
      currentLeg,
      nextPlayer,
      startingPlayerId: currentLeg % 2 === 1 ? match.firstPlayer : match.firstPlayer === match.playerAId ? match.playerBId : match.playerAId,
      scores: {
        playerAScoreLeft: STARTING_SCORE - playerAScore,
        playerBScoreLeft: STARTING_SCORE - playerBScore,
        playerADarts: playerADarts,
        playerBDarts: playerBDarts,
      },
      averages: {
        playerA: calculateAverage(playerAAggregates._sum.score, playerAAggregates._sum.darts),
        playerB: calculateAverage(playerBAggregates._sum.score, playerBAggregates._sum.darts),
      },
    }
  }
}