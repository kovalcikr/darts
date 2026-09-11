import { unstable_cache } from "next/cache";

import { findMatchLiveStates } from "@/app/lib/match-live-state";
import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { findMatchAvg, getPlayerThrowInfo } from "@/app/lib/playerThrow";
import { getTableMappings } from "@/app/lib/table-mappings";

function cachedMatch(slot: number) {
  return unstable_cache(
    (tid: string, table: string) => getCuescoreMatchCached(tid, table),
    [`cachedMatch${slot}`],
    { tags: [`match${slot}`] }
  );
}

function cachedMatchInfo(slot: number) {
  return unstable_cache(
    (tid: string, mid: string, leg: number, a: string, b: string) =>
      getPlayerThrowInfo(tid, mid, leg, a, b),
    [`cachedMatchInfo${slot}`],
    { tags: [`match${slot}`] }
  );
}

function cachedFirstPlayer(slot: number) {
  return unstable_cache(
    (mid: string) => getMatch(mid),
    [`cachedFirstPlayer${slot}`],
    { tags: [`match${slot}`] }
  );
}

function getLiveAverage(liveState: any, player: 'A' | 'B') {
  const score = player === 'A' ? liveState.playerATotalScore : liveState.playerBTotalScore;
  const darts = player === 'A' ? liveState.playerATotalDarts : liveState.playerBTotalDarts;
  return darts > 0 ? score / darts * 3 : 0;
}

function getLiveMatchInfo(liveState: any, match: any) {
  if (!liveState || !match) {
    return null;
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
    lastThrows: Array.isArray(liveState.lastThrows) ? liveState.lastThrows : [],
  };
}

export async function getDashboardTournamentSnapshot(tournamentId: string) {
  const mappings = await getTableMappings();
  const matches = await Promise.all(
    mappings.map(mapping => cachedMatch(mapping.slot)(tournamentId, mapping.cuescoreTableName))
  );
  const matchIds = matches.map(m => m?.matchId ? String(m.matchId) : null);
  const liveStates = await findMatchLiveStates(
    matchIds.filter((id): id is string => Boolean(id))
  );
  const liveByMid = new Map(liveStates.map(ls => [ls.matchId, ls]));

  const slotData = await Promise.all(
    mappings.map(async (mapping, i) => {
      const match = matches[i];
      const liveState = match?.matchId ? liveByMid.get(String(match.matchId)) ?? null : null;

      const matchInfo = match?.matchId
        ? liveState
          ? getLiveMatchInfo(liveState, match)
          : await cachedMatchInfo(mapping.slot)(
              tournamentId,
              String(match.matchId),
              (match.scoreA || 0) + (match.scoreB || 0) + 1,
              match.playerA.playerId.toString(),
              match.playerB.playerId.toString()
            )
        : null;

      const firstPlayer = liveState
        ? null
        : match?.matchId
          ? (await cachedFirstPlayer(mapping.slot)(String(match.matchId)))?.firstPlayer ?? null
          : null;

      const matchAvgA = liveState
        ? getLiveAverage(liveState, 'A')
        : match?.matchId
          ? await findMatchAvg(String(match.matchId), String(match.playerA.playerId))
          : null;

      const matchAvgB = liveState
        ? getLiveAverage(liveState, 'B')
        : match?.matchId
          ? await findMatchAvg(String(match.matchId), String(match.playerB.playerId))
          : null;

      return { slot: mapping.slot, match, matchInfo, liveState, firstPlayer, matchAvgA, matchAvgB };
    })
  );

  return { tables: slotData };
}
