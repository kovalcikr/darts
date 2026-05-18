import { getNextPlayer, type LegTurnContext } from './leg-turn'

export type ScoringThrow = {
  id: string
  playerId: string
  score: number
  darts: number
  checkout: boolean
  leg: number
  time?: Date
}

export type CheckoutDartCount = 1 | 2 | 3

export const CHECKOUT_DART_OPTIONS: CheckoutDartCount[] = [1, 2, 3]

export type LegScore = {
  playerAScoreLeft: number
  playerBScoreLeft: number
  playerADarts: number
  playerBDarts: number
}

export type MatchState = {
  leg: number
  scores: LegScore
  averages: { playerA: number; playerB: number }
  lastThrows: ScoringThrow[]
  nextPlayer: string | null
  startingPlayerId: string | null
}

export const STARTING_SCORE = 501

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const BOARD_NUMBERS = range(1, 20)
const SCORING_DART_SCORES = Array.from(
  new Set([
    0,
    ...BOARD_NUMBERS,
    25,
    ...BOARD_NUMBERS.map((n) => n * 2),
    ...BOARD_NUMBERS.map((n) => n * 3),
    50,
  ]),
).sort((a, b) => a - b)

const FINISHING_DOUBLE_SCORES = Array.from(
  new Set([...BOARD_NUMBERS.map((n) => n * 2), 50])
).sort((a, b) => a - b)

function canCheckoutExactly(
  remainingScore: number,
  dartsCount: 1 | 2 | 3
): boolean {
  if (dartsCount === 1) {
    return FINISHING_DOUBLE_SCORES.includes(remainingScore)
  }

  for (const dartScore of SCORING_DART_SCORES) {
    const nextRemaining = remainingScore - dartScore
    if (nextRemaining < 2) continue
    if (canCheckoutExactly(nextRemaining, ((dartsCount - 1) as 1 | 2 | 3))) {
      return true
    }
  }
  return false
}

export function getAllowedCheckoutDarts(
  remainingScore: number
): (1 | 2 | 3)[] {
  if (!Number.isInteger(remainingScore) || remainingScore < 2) {
    return []
  }
  return ([1, 2, 3] as const).filter((d) => canCheckoutExactly(remainingScore, d))
}

export function calculateLegState(params: {
  throws: Array<{ playerId: string; score: number; darts: number }>
  leg: number
  playerAId: string
  playerBId: string
  firstPlayer: string | null
  startingScore?: number
}): LegScore & { nextPlayer: string | null } {
  const {
    throws,
    leg,
    playerAId,
    playerBId,
    firstPlayer,
    startingScore = STARTING_SCORE,
  } = params

  const playerAThrows = throws.filter((t) => t.playerId === playerAId)
  const playerBThrows = throws.filter((t) => t.playerId === playerBId)

  const playerAStats = playerAThrows
    .reduce(
      (acc, t) => ({ sum: acc.sum + t.score, count: acc.count + t.darts }),
      { sum: 0, count: 0 }
    )
  const playerBStats = playerBThrows
    .reduce(
      (acc, t) => ({ sum: acc.sum + t.score, count: acc.count + t.darts }),
      { sum: 0, count: 0 }
    )

  const nextPlayer = getNextPlayer({
    currentLeg: leg,
    throwsByA: playerAThrows.length,
    throwsByB: playerBThrows.length,
    firstPlayer,
    playerAId,
    playerBId,
  })

  return {
    playerAScoreLeft: startingScore - playerAStats.sum,
    playerBScoreLeft: startingScore - playerBStats.sum,
    playerADarts: playerAStats.count,
    playerBDarts: playerBStats.count,
    nextPlayer,
  }
}

export function calculateThreeDartAverage(
  totalScore: number,
  totalDarts: number
): number {
  if (!totalDarts) return 0
  return (totalScore / totalDarts) * 3
}

export async function getMatchState(params: {
  matchId: string
  leg: number
  playerAId: string
  playerBId: string
  firstPlayer: string | null
  startingScore?: number
  fetchLegThrows?: (
    matchId: string,
    leg: number
  ) => Promise<Array<{ playerId: string; score: number; darts: number }>>
  fetchMatchThrows?: (
    matchId: string
  ) => Promise<Array<{ playerId: string; score: number; darts: number }>>
  fetchLastThrows?: (
    matchId: string,
    leg: number,
    limit: number
  ) => Promise<ScoringThrow[]>
}): Promise<MatchState> {
  const {
    matchId,
    leg,
    playerAId,
    playerBId,
    firstPlayer,
    startingScore = STARTING_SCORE,
    fetchLegThrows,
    fetchMatchThrows,
    fetchLastThrows,
  } = params

  const [legThrows, matchThrows, lastThrows] = await Promise.all([
    fetchLegThrows?.(matchId, leg) ?? [],
    fetchMatchThrows?.(matchId) ?? [],
    fetchLastThrows?.(matchId, leg, 6) ?? [],
  ])

  const legState = calculateLegState({
    throws: legThrows,
    leg,
    playerAId,
    playerBId,
    firstPlayer,
    startingScore,
  })

  const playerAMatchStats = matchThrows
    .filter((t) => t.playerId === playerAId)
    .reduce(
      (acc, t) => ({ sum: acc.sum + t.score, count: acc.count + t.darts }),
      { sum: 0, count: 0 }
    )
  const playerBMatchStats = matchThrows
    .filter((t) => t.playerId === playerBId)
    .reduce(
      (acc, t) => ({ sum: acc.sum + t.score, count: acc.count + t.darts }),
      { sum: 0, count: 0 }
    )

  return {
    leg,
    scores: {
      playerAScoreLeft: legState.playerAScoreLeft,
      playerBScoreLeft: legState.playerBScoreLeft,
      playerADarts: legState.playerADarts,
      playerBDarts: legState.playerBDarts,
    },
    averages: {
      playerA: calculateThreeDartAverage(
        playerAMatchStats.sum,
        playerAMatchStats.count
      ),
      playerB: calculateThreeDartAverage(
        playerBMatchStats.sum,
        playerBMatchStats.count
      ),
    },
    lastThrows,
    nextPlayer: legState.nextPlayer,
    startingPlayerId: firstPlayer,
  }
}