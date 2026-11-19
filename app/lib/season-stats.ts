import 'server-only'

import { revalidateTag, unstable_cache } from 'next/cache'
import prisma from './db'
import { getPlayers } from './players'
import { findTournamentIdsBySeason } from './data/tournament-queries'

const SEASON_STATS_TAG = 'season-stats'
const SEASON_STATS_REVALIDATE_SECONDS = 300

export type SeasonStats = {
  season: string
  playerCount: number
  tournamentCount: number
  matchCount: number
  legCount: number
  throwCount: number
  dartCount: number | null
  count180: number
  count171Plus: number
  bestAverage: { threeDartAverage: number; playerIds: string[] } | null
  bestCheckout: { score: number; playerIds: string[] } | null
  bestLeg: { darts: number; playerIds: string[] } | null
  playerNames: Record<string, string>
}

type PlayerThrowTotals = {
  playerId: string
  score: number
  darts: number
}

type LegTotal = {
  playerId: string
  darts: number
}

type CheckoutThrow = {
  playerId: string
  score: number
}

type SeasonStatsInput = {
  season: string
  tournamentCount: number
  matchCount: number
  legCount: number
  throwCount: number
  dartCount: number | null
  count180: number
  count171Plus: number
  playerThrowTotals: PlayerThrowTotals[]
  legTotals: LegTotal[]
  bestCheckouts: CheckoutThrow[]
  playerNames: Record<string, string>
}

function buildSeasonStats(input: SeasonStatsInput): SeasonStats {
  const rankedPlayers = input.playerThrowTotals
    .filter((totals) => input.playerNames[totals.playerId])
    .sort((a, b) => (b.score / b.darts) - (a.score / a.darts))

  const bestAverage = rankedPlayers.length > 0
    ? {
        threeDartAverage: (rankedPlayers[0].score / rankedPlayers[0].darts) * 3,
        playerIds: [rankedPlayers[0].playerId],
      }
    : null

  const legsSorted = [...input.legTotals].sort((a, b) => a.darts - b.darts)
  const bestLeg = legsSorted.length > 0
    ? {
        darts: legsSorted[0].darts,
        playerIds: Array.from(
          new Set(
            legsSorted
              .filter((leg) => leg.darts === legsSorted[0].darts)
              .map((leg) => leg.playerId)
          )
        ),
      }
    : null

  const bestCheckout = input.bestCheckouts.length > 0
    ? {
        score: input.bestCheckouts[0].score,
        playerIds: Array.from(new Set(input.bestCheckouts.map((checkout) => checkout.playerId))),
      }
    : null

  return {
    season: input.season,
    playerCount: Object.keys(input.playerNames).length,
    tournamentCount: input.tournamentCount,
    matchCount: input.matchCount,
    legCount: input.legCount,
    throwCount: input.throwCount,
    dartCount: input.dartCount,
    count180: input.count180,
    count171Plus: input.count171Plus,
    bestAverage,
    bestCheckout,
    bestLeg,
    playerNames: input.playerNames,
  }
}

async function loadSeasonStats(season: string): Promise<SeasonStats> {
  const tournamentIds = await findTournamentIdsBySeason(season)
  const tournamentIdFilter = { in: tournamentIds }

  const [
    matchAggregate,
    throw180Aggregate,
    throw171PlusAggregate,
    throwAggregate,
    throwsPerPlayer,
    legs,
    playerNames,
    bestCheckoutProbe,
  ] = await Promise.all([
    prisma.match.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        playerALegs: true,
        playerBlegs: true,
      },
      where: {
        tournamentId: tournamentIdFilter,
      },
    }),
    prisma.playerThrow.aggregate({
      _count: {
        id: true,
      },
      where: {
        tournamentId: tournamentIdFilter,
        undoneAt: null,
        score: 180,
      },
    }),
    prisma.playerThrow.aggregate({
      _count: {
        id: true,
      },
      where: {
        tournamentId: tournamentIdFilter,
        undoneAt: null,
        score: {
          gte: 171,
          lt: 180,
        },
      },
    }),
    prisma.playerThrow.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        score: true,
        darts: true,
      },
      where: {
        tournamentId: tournamentIdFilter,
        undoneAt: null,
      },
    }),
    prisma.playerThrow.groupBy({
      by: ['playerId'],
      where: {
        tournamentId: tournamentIdFilter,
        undoneAt: null,
      },
      _sum: {
        score: true,
        darts: true,
      },
    }),
    prisma.playerThrow.groupBy({
      by: ['tournamentId', 'matchId', 'leg', 'playerId'],
      where: {
        tournamentId: tournamentIdFilter,
        undoneAt: null,
      },
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
      },
    }),
    getPlayers(tournamentIds),
    prisma.playerThrow.findFirst({
      where: {
        checkout: true,
        tournamentId: tournamentIdFilter,
        undoneAt: null,
      },
      orderBy: {
        score: 'desc',
      },
      select: {
        score: true,
      },
    }),
  ])

  const bestCheckouts = bestCheckoutProbe
    ? await prisma.playerThrow.findMany({
        where: {
          checkout: true,
          tournamentId: tournamentIdFilter,
          undoneAt: null,
          score: bestCheckoutProbe.score,
        },
        select: {
          playerId: true,
          score: true,
        },
      })
    : []

  return buildSeasonStats({
    season,
    tournamentCount: tournamentIds.length,
    matchCount: matchAggregate._count.id,
    legCount: (matchAggregate._sum.playerALegs ?? 0) + (matchAggregate._sum.playerBlegs ?? 0),
    throwCount: throwAggregate._count.id,
    dartCount: throwAggregate._sum.darts,
    count180: throw180Aggregate._count.id,
    count171Plus: throw171PlusAggregate._count.id,
    playerThrowTotals: throwsPerPlayer.map((row) => ({
      playerId: row.playerId,
      score: row._sum.score ?? 0,
      darts: row._sum.darts ?? 0,
    })),
    legTotals: legs.map((leg) => ({
      playerId: leg.playerId,
      darts: leg._sum.darts ?? 0,
    })),
    bestCheckouts: bestCheckouts.map((checkout) => ({
      playerId: checkout.playerId,
      score: checkout.score,
    })),
    playerNames,
  })
}

export const getSeasonStats = unstable_cache(
  loadSeasonStats,
  ['season-stats'],
  { tags: [SEASON_STATS_TAG], revalidate: SEASON_STATS_REVALIDATE_SECONDS }
)

export function invalidateSeasonStats() {
  // 'max' only marks the entry stale, so the next read still serves the old value.
  revalidateTag(SEASON_STATS_TAG, { expire: 0 })
}
