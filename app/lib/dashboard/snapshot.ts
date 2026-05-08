import type { MatchLiveState } from '../match-live-state/model'
import type { CueScoreMatch } from '../integrations/cuescore/types'
import type { DashboardTournamentFetcher } from './tournament-fetcher'

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

export async function getDashboardSnapshot(
  tournamentId: string,
  fetcher?: DashboardTournamentFetcher
): Promise<DashboardSnapshot> {
  const { findMatchLiveStates } = await import('../data')
  const { getTableIdBySlot } = await import('../table-mappings')
  const { createDefaultTournamentFetcher } = await import('./tournament-fetcher')
  
  const tournamentFetcher = fetcher ?? await createDefaultTournamentFetcher()
  
  const tableIds = await Promise.all([1, 2, 3, 4, 5, 6].map(getTableIdBySlot))
  
  const matches = await Promise.all(
    tableIds.map(async (tableId) => {
      const match = await tournamentFetcher.getMatchInTable(tournamentId, tableId)
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