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
  liveState: MatchLiveState | null
}

export type DashboardSnapshot = {
  matches: (CueScoreMatch | null)[]
  liveStates: (MatchLiveState | null)[]
  tableIds: (string | null)[]
}

export async function getDashboardSnapshot(tournamentId: string): Promise<DashboardSnapshot> {
  const { findMatchLiveStates } = await import('../data')
  const { getCuescoreMatchCached } = await import('../match')
  const { getTableIdBySlot } = await import('../table-mappings')

  const tableIds = await Promise.all([1, 2, 3, 4, 5, 6].map(getTableIdBySlot))

  const matches = await Promise.all(
    tableIds.map(async (tableId) => {
      const match = await getCuescoreMatchCached(tournamentId, tableId)
      if (match) {
        match.matchId = String(match.matchId)
      }
      return match
    })
  )

  const liveStates = await findMatchLiveStates(
    matches
      .map((m) => (m?.matchId ? String(m.matchId) : null))
      .filter((id): id is string => Boolean(id))
  )
  const liveStateByMatchId = new Map(liveStates.map((ls) => [ls.matchId, ls]))

  const tableProjections: TableProjection[] = matches.map((match, i) => ({
    tableId: tableIds[i],
    match,
    liveState: match?.matchId ? liveStateByMatchId.get(String(match.matchId)) ?? null : null,
  }))

  return {
    matches: tableProjections.map((t) => t.match),
    liveStates: tableProjections.map((t) => t.liveState),
    tableIds: tableProjections.map((t) => t.tableId),
  }
}