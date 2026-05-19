import { findMatch, findThrowsByMatch, findScoreboardThrowHistory, findHighestScoreInMatch, findBestCheckoutInMatch, findBestLegInMatch, aggregateMatchThrows } from '@/app/lib/data'
import { calculateThreeDartAverage, STARTING_SCORE, getNextPlayer, getLegStarter } from '@/app/lib/score-entry'
import type { Match, Tournament, PlayerThrow } from '@/prisma/client'

export type PlayerStats = {
  id: string
  name: string
  imageUrl: string
  score: number
  dartsCount: number
  lastThrow: number
  matchAvg: number
  legCount: number
  active: boolean
  highestScore: number
  bestCheckout: number
  bestLeg: number
}

export type MatchState = {
  match: Match & { tournament: Tournament }
  currentLeg: number
  nextPlayer: string
  startingPlayerId: string | null
  playerA: PlayerStats
  playerB: PlayerStats
  throws: PlayerThrow[]
  throwHistory: Array<{
    id: string
    playerId: string
    score: number
    darts: number
    checkout: boolean
    leg: number
    status: 'active' | 'undone'
    activityTime: Date
  }>
}

async function getPlayerMatchStats(matchId: string, playerId: string) {
  const [highest, checkout, bestLeg, aggregates] = await Promise.all([
    findHighestScoreInMatch(matchId, playerId),
    findBestCheckoutInMatch(matchId, playerId),
    findBestLegInMatch(matchId, playerId),
    aggregateMatchThrows(matchId, playerId),
  ])

  return {
    highestScore: highest,
    bestCheckout: checkout,
    bestLeg: bestLeg,
    matchAvg: calculateThreeDartAverage(
      aggregates._sum.score ?? 0,
      aggregates._sum.darts ?? 0
    ),
  }
}

export async function getMatchState(matchId: string): Promise<MatchState | null> {
  const match = await findMatch(matchId)
  if (!match || !match.tournament) {
    return null
  }

  const leg = match.playerALegs + match.playerBlegs + 1

  const throws = await findThrowsByMatch(matchId)
  const throwHistory = await findScoreboardThrowHistory(matchId)

  const legThrows = throws.filter(t => t.leg === leg)
  const playerALegThrows = legThrows.filter(t => t.playerId === match.playerAId)
  const playerBLegThrows = legThrows.filter(t => t.playerId === match.playerBId)

  const playerAScore = playerALegThrows.reduce((s, t) => s + t.score, 0)
  const playerBScore = playerBLegThrows.reduce((s, t) => s + t.score, 0)
  const playerADarts = playerALegThrows.reduce((s, t) => s + t.darts, 0)
  const playerBDarts = playerBLegThrows.reduce((s, t) => s + t.darts, 0)

  const nextPlayer = getNextPlayer({
    currentLeg: leg,
    throwsByA: playerALegThrows.length,
    throwsByB: playerBLegThrows.length,
    firstPlayer: match.firstPlayer,
    playerAId: match.playerAId,
    playerBId: match.playerBId,
  })

  const currentLegStarter = getLegStarter({
    leg,
    firstPlayer: match.firstPlayer,
    playerAId: match.playerAId,
    playerBId: match.playerBId,
  })

  const [playerAStats, playerBStats] = await Promise.all([
    getPlayerMatchStats(matchId, match.playerAId),
    getPlayerMatchStats(matchId, match.playerBId),
  ])

  const playerA: PlayerStats = {
    id: match.playerAId,
    name: match.playerAName,
    imageUrl: match.playerAImage,
    score: STARTING_SCORE - playerAScore,
    dartsCount: playerADarts,
    lastThrow: playerALegThrows.at(-1)?.score ?? 0,
    legCount: match.playerALegs,
    active: nextPlayer === match.playerAId,
    ...playerAStats,
  }

  const playerB: PlayerStats = {
    id: match.playerBId,
    name: match.playerBName,
    imageUrl: match.playerBImage,
    score: STARTING_SCORE - playerBScore,
    dartsCount: playerBDarts,
    lastThrow: playerBLegThrows.at(-1)?.score ?? 0,
    legCount: match.playerBlegs,
    active: nextPlayer === match.playerBId,
    ...playerBStats,
  }

  return {
    match,
    currentLeg: leg,
    nextPlayer,
    startingPlayerId: currentLegStarter,
    playerA,
    playerB,
    throws,
    throwHistory,
  }
}