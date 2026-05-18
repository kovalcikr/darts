import 'server-only'

import { unstable_cache } from 'next/cache'
import { getCuescoreMatchCached, getMatch } from '@/app/lib/match'
import { findMatchLiveStates } from '@/app/lib/data'
import { findMatchAvg, getPlayerThrowInfo } from '@/app/lib/playerThrow'
import type { CueScoreMatch } from '@/app/lib/integrations/cuescore/types'
import type { MatchLiveState } from '@/app/lib/match-live-state/model'

export type MatchInfo = {
    score: Array<{ playerId: string; _sum: { score: number | null }; _count?: { score: number } }>
    lastThrows: Array<{ playerId: string; score: number; darts: number; checkout: boolean; leg: number }>
}

export type TableSlotSnapshot = {
    match: CueScoreMatch | null
    liveState: MatchLiveState | null
    firstPlayer: string | null
    averages: { playerA: number | null; playerB: number | null }
    matchInfo: MatchInfo | null
}

async function getTableSlotSnapshotUncached(
    tournamentId: string,
    tableId: string
): Promise<TableSlotSnapshot> {
    const match = await getCuescoreMatchCached(tournamentId, tableId)
    
    if (!match) {
        return {
            match: null,
            liveState: null,
            firstPlayer: null,
            averages: { playerA: null, playerB: null },
            matchInfo: null,
        }
    }

    const matchIdStr = String(match.matchId)
    const liveStates = await findMatchLiveStates([matchIdStr])
    const liveState = liveStates[0] ?? null

    let firstPlayer: string | null = null
    let averages = { playerA: null as number | null, playerB: null as number | null }
    let matchInfo: MatchInfo | null = null

    if (liveState) {
        firstPlayer = liveState.startingPlayerId
        averages = {
            playerA: liveState.playerATotalDarts > 0 
                ? (liveState.playerATotalScore / liveState.playerATotalDarts) * 3 
                : null,
            playerB: liveState.playerBTotalDarts > 0 
                ? (liveState.playerBTotalScore / liveState.playerBTotalDarts) * 3 
                : null,
        }
    } else {
        const dbMatch = await getMatch(matchIdStr)
        if (dbMatch) {
            firstPlayer = dbMatch.firstPlayer
            const playerAId = String(match.playerA.playerId)
            const playerBId = String(match.playerB.playerId)
            const leg = (match.scoreA || 0) + (match.scoreB || 0) + 1
            const [avgA, avgB, info] = await Promise.all([
                findMatchAvg(matchIdStr, playerAId),
                findMatchAvg(matchIdStr, playerBId),
                getPlayerThrowInfo(tournamentId, matchIdStr, leg, playerAId, playerBId),
            ])
            averages = { playerA: avgA, playerB: avgB }
            matchInfo = info
        }
    }

    return {
        match,
        liveState,
        firstPlayer,
        averages,
        matchInfo,
    }
}

type DashboardSnapshot = Record<string, unknown>

function buildSnapshotFromSlots(slots: TableSlotSnapshot[]): DashboardSnapshot {
    const result: DashboardSnapshot = {}
    
    slots.forEach((slot, index) => {
        const n = index + 1
        result[`match${n}`] = slot.match
        result[`liveState${n}`] = slot.liveState
        result[`firstPlayer${n}`] = slot.firstPlayer
        result[`matchAvgA${n}`] = slot.averages.playerA
        result[`matchAvgB${n}`] = slot.averages.playerB
        result[`matchInfo${n}`] = slot.matchInfo
    })
    
    return result
}

export async function getDashboardSnapshot(tournamentId: string): Promise<DashboardSnapshot> {
    const { getTableMappings } = await import('./table-mappings')
    const mappings = await getTableMappings()

    const results = await Promise.all(
        mappings.map(async ({ slot, cuescoreTableName }) => {
            // Use slot-based cache tag for proper isolation (e.g., match1, match2)
            const cacheTag = `match${slot}`
            const cached = unstable_cache(
                async (tId: string) => getTableSlotSnapshotUncached(tId, cuescoreTableName),
                [`dashboard-snapshot-${slot}`],
                { tags: [cacheTag] }
            )
            return cached(tournamentId)
        })
    )

    return buildSnapshotFromSlots(results)
}