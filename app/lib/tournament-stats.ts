import 'server-only'

import type { Prisma } from '@/prisma/client'
import { unstable_cache } from 'next/cache'
import prisma from './db'

type MatchAverageRow = {
  playerId: string
  _sum: {
    score: number | null
    darts: number | null
  }
}

type HighScoreSummary = {
  player: string
  s80: number
  s100: number
  s133: number
  s170: number
  b170: number[]
  s180: number
  index: number
}

type BestCheckoutSummary = {
  player: string
  c60: number
  c80: number
  c100: number
  scores: number[]
  index: number
}

type BestLegSummary = {
  player: string
  best: number
  index: number
  [round: number]: number
}

type MatchAverageSummary = {
  player: string
  max: number
  u40: number
  o40: number
  o50: number
  o55: number
  o60: number
  o65: number
  o75: number
}

function averageForMatch(match: MatchAverageRow) {
  return match._sum.darts ? (((match._sum.score ?? 0) / match._sum.darts) * 3) : 0
}

function getTournamentThrowWhere(tournamentId: string): Prisma.PlayerThrowWhereInput {
  return {
    tournamentId,
  }
}

function summarizeHighScores(highScoreRows: Array<{ playerId: string; score: number }>) {
  const summaries: Record<string, HighScoreSummary> = {}

  highScoreRows.forEach((scoreRow, index) => {
    const summary = summaries[scoreRow.playerId]
    if (!summary) {
      summaries[scoreRow.playerId] = {
        player: scoreRow.playerId,
        s80: scoreRow.score >= 80 && scoreRow.score < 95 ? 1 : 0,
        s100: scoreRow.score >= 95 && scoreRow.score < 133 ? 1 : 0,
        s133: scoreRow.score >= 133 && scoreRow.score < 170 ? 1 : 0,
        s170: scoreRow.score >= 170 && scoreRow.score < 180 ? 1 : 0,
        b170: scoreRow.score > 140 ? [scoreRow.score] : [],
        s180: scoreRow.score === 180 ? 1 : 0,
        index,
      }
      return
    }

    summary.s80 += scoreRow.score >= 80 && scoreRow.score < 95 ? 1 : 0
    summary.s100 += scoreRow.score >= 95 && scoreRow.score < 133 ? 1 : 0
    summary.s133 += scoreRow.score >= 133 && scoreRow.score < 170 ? 1 : 0
    summary.s170 += scoreRow.score >= 170 && scoreRow.score < 180 ? 1 : 0
    summary.s180 += scoreRow.score === 180 ? 1 : 0
    if (scoreRow.score > 140) {
      summary.b170.push(scoreRow.score)
    }
  })

  return Object.values(summaries).sort(
    (a, b) =>
      (b.s180 - a.s180) ||
      (b.s170 - a.s170) ||
      (b.s133 - a.s133) ||
      (b.s100 - a.s100) ||
      (b.s80 - a.s80) ||
      a.index - b.index
  )
}

function summarizeBestCheckouts(bestCheckoutRows: Array<{ playerId: string; score: number }>) {
  const summaries: Record<string, BestCheckoutSummary> = {}

  bestCheckoutRows.forEach((checkoutRow, index) => {
    const summary = summaries[checkoutRow.playerId]
    if (!summary) {
      summaries[checkoutRow.playerId] = {
        player: checkoutRow.playerId,
        c60: checkoutRow.score >= 60 && checkoutRow.score < 80 ? 1 : 0,
        c80: checkoutRow.score >= 80 && checkoutRow.score < 100 ? 1 : 0,
        c100: checkoutRow.score >= 100 ? 1 : 0,
        scores: [checkoutRow.score],
        index,
      }
      return
    }

    summary.c60 += checkoutRow.score >= 60 && checkoutRow.score < 80 ? 1 : 0
    summary.c80 += checkoutRow.score >= 80 && checkoutRow.score < 100 ? 1 : 0
    summary.c100 += checkoutRow.score >= 100 ? 1 : 0
    summary.scores.push(checkoutRow.score)
  })

  return {
    bestCheckout: bestCheckoutRows,
    bestCoc: Object.values(summaries).sort(
      (a, b) => (b.c100 - a.c100) || (b.c80 - a.c80) || (b.c60 - a.c60) || a.index - b.index
    ),
  }
}

function summarizeBestLegs(
  bestLegRows: Array<{ playerId: string; _sum: { darts: number | null } }>
) {
  const legMap: Record<string, BestLegSummary> = {}

  bestLegRows.forEach((leg, index) => {
    const darts = leg._sum.darts ?? 0
    const round = Math.ceil(darts / 3)
    const player = legMap[leg.playerId]

    if (!player) {
      legMap[leg.playerId] = {
        player: leg.playerId,
        best: darts,
        [round]: 1,
        index,
      }
      return
    }

    if (player.best >= darts) {
      player.best = darts
    }
    player[round] = (player[round] ?? 0) + 1
  })

  const bestLegDarts = bestLegRows[0]?._sum?.darts ?? 0
  const bLegPlayers = bestLegRows
    .filter((leg) => leg._sum.darts === bestLegDarts)
    .reduce<Record<string, number>>((players, leg) => {
      players[leg.playerId] = (players[leg.playerId] ?? 0) + 1
      return players
    }, {})

  return {
    bLeg: Object.values(legMap).sort((a, b) => a.index - b.index),
    bestLegDarts,
    bLegPlayers,
  }
}

function summarizeMatchAverages(matchSums: MatchAverageRow[]) {
  const bestAvg = [...matchSums].sort((a, b) => averageForMatch(b) - averageForMatch(a))
  const avgPerPlayer: Record<string, MatchAverageSummary> = {}

  bestAvg.forEach((match) => {
    const average = averageForMatch(match)
    const player = avgPerPlayer[match.playerId]

    if (!player) {
      avgPerPlayer[match.playerId] = {
        player: match.playerId,
        max: average,
        u40: average < 40 ? 1 : 0,
        o40: average >= 40 && average < 50 ? 1 : 0,
        o50: average >= 50 && average < 55 ? 1 : 0,
        o55: average >= 55 && average < 60 ? 1 : 0,
        o60: average >= 60 && average < 65 ? 1 : 0,
        o65: average >= 65 && average < 75 ? 1 : 0,
        o75: average >= 75 ? 1 : 0,
      }
      return
    }

    if (player.max < average) {
      player.max = average
    }
    player.u40 += average < 40 ? 1 : 0
    player.o40 += average >= 40 && average < 50 ? 1 : 0
    player.o50 += average >= 50 && average < 55 ? 1 : 0
    player.o55 += average >= 55 && average < 60 ? 1 : 0
    player.o60 += average >= 60 && average < 65 ? 1 : 0
    player.o65 += average >= 65 && average < 75 ? 1 : 0
    player.o75 += average >= 75 ? 1 : 0
  })

  return {
    bestAvg,
    avgPP: Object.values(avgPerPlayer).sort((a, b) => b.max - a.max),
  }
}

export async function getTournamentStatsSnapshot(tournamentId: string) {
  const tournamentThrowWhere = getTournamentThrowWhere(tournamentId)

  const [matches, highScoreRows, bestCheckoutRows, bestLegRows, matchSums] = await Promise.all([
    prisma.match.findMany({
      where: {
        tournamentId,
      },
    }),
    prisma.playerThrow.findMany({
      where: {
        ...tournamentThrowWhere,
        score: {
          gte: 80,
        },
      },
      orderBy: {
        score: 'desc',
      },
    }),
    prisma.playerThrow.findMany({
      where: {
        ...tournamentThrowWhere,
        checkout: true,
        score: {
          gte: 60,
        },
      },
      orderBy: {
        score: 'desc',
      },
    }),
    prisma.playerThrow.groupBy({
      by: ['tournamentId', 'matchId', 'leg', 'playerId'],
      where: tournamentThrowWhere,
      _sum: {
        score: true,
        darts: true,
      },
      having: {
        score: {
          _sum: {
            equals: 501,
          },
        },
        darts: {
          _sum: {
            lte: 27,
          },
        },
      },
      orderBy: [
        {
          _sum: {
            darts: 'asc',
          },
        },
      ],
    }),
    prisma.playerThrow.groupBy({
      by: ['tournamentId', 'matchId', 'playerId'],
      where: tournamentThrowWhere,
      _sum: {
        score: true,
        darts: true,
      },
    }),
  ])

  const highScore = summarizeHighScores(highScoreRows)
  const { bestCheckout, bestCoc } = summarizeBestCheckouts(bestCheckoutRows)
  const { bLeg, bestLegDarts, bLegPlayers } = summarizeBestLegs(bestLegRows)
  const { bestAvg, avgPP } = summarizeMatchAverages(matchSums)

  return {
    matches,
    highScore,
    bestCheckout,
    bestCoc,
    bLeg,
    bestLegDarts,
    bLegPlayers,
    bestAvg,
    avgPP,
  }
}

export const getCachedTournamentStats = unstable_cache(
  async (tournamentId: string) => getTournamentStatsSnapshot(tournamentId),
  ['tournament-stats']
)
