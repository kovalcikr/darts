import type { MatchLiveState } from '../match-live-state/model'
import type { CueScoreMatch } from '../integrations/cuescore/types'

export type TableCacheTags = {
  match: string
  matchInfo: string
  firstPlayer: string
}

export function getMatchCacheTag(tableNum: number): string {
  return `match${tableNum}`
}

export function getMatchInfoCacheTag(tableNum: number): string {
  return `matchInfo${tableNum}`
}

export function getFirstPlayerCacheTag(tableNum: number): string {
  return `firstPlayer${tableNum}`
}

export function createTableCacheTags(tableNum: number): TableCacheTags {
  return {
    match: getMatchCacheTag(tableNum),
    matchInfo: getMatchInfoCacheTag(tableNum),
    firstPlayer: getFirstPlayerCacheTag(tableNum),
  }
}

export type TableProjection = {
  tableId: string | null
  match: CueScoreMatch | null
  matchInfo: { score: Array<{ playerId: string; _sum: { score: number }; _count: { score: number } }>; lastThrows: MatchLiveState['lastThrows'] } | null
  liveState: MatchLiveState | null
  firstPlayer: string | null
  matchAvgA: number | null
  matchAvgB: number | null
}

export function getLiveMatchInfo(
  liveState: MatchLiveState | null,
  match: CueScoreMatch | null
): { score: Array<{ playerId: string; _sum: { score: number }; _count: { score: number } }>; lastThrows: MatchLiveState['lastThrows'] } | null {
  if (!liveState || !match) {
    return null
  }

  return {
    score: [
      {
        playerId: String(match.playerA.playerId),
        _sum: { score: 501 - liveState.playerAScoreLeft },
        _count: { score: 0 },
      },
      {
        playerId: String(match.playerB.playerId),
        _sum: { score: 501 - liveState.playerBScoreLeft },
        _count: { score: 0 },
      },
    ],
    lastThrows: liveState.lastThrows,
  }
}

export function getLiveAverage(liveState: MatchLiveState | null, player: 'A' | 'B'): number {
  if (!liveState) return 0
  const score = player === 'A' ? liveState.playerATotalScore : liveState.playerBTotalScore
  const darts = player === 'A' ? liveState.playerATotalDarts : liveState.playerBTotalDarts
  return darts > 0 ? (score / darts) * 3 : 0
}

export type DashboardSnapshot = {
  matches: (CueScoreMatch | null)[]
  matchInfos: (TableProjection['matchInfo'] | null)[]
  liveStates: (MatchLiveState | null)[]
  tableIds: (string | null)[]
  firstPlayers: (string | null)[]
  matchAvgA: (number | null)[]
  matchAvgB: (number | null)[]
}

export async function getDashboardSnapshot(tournamentId: string): Promise<DashboardSnapshot> {
  // TODO: Implement actual fetching logic
  return {
    matches: Array(6).fill(null) as (CueScoreMatch | null)[],
    matchInfos: Array(6).fill(null) as (TableProjection['matchInfo'] | null)[],
    liveStates: Array(6).fill(null) as (MatchLiveState | null)[],
    tableIds: Array(6).fill(null) as (string | null)[],
    firstPlayers: Array(6).fill(null) as (string | null)[],
    matchAvgA: Array(6).fill(null) as (number | null)[],
    matchAvgB: Array(6).fill(null) as (number | null)[],
  }
}