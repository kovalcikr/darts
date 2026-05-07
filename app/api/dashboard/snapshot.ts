import { unstable_cache } from "next/cache";

import { findMatchLiveStates } from "@/app/lib/data";
import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { findMatchAvg, getPlayerThrowInfo } from "@/app/lib/playerThrow";
import { getTableIdBySlot } from "@/app/lib/table-mappings";
import {
  getMatchCacheTag,
  getMatchInfoCacheTag,
  getFirstPlayerCacheTag,
  getLiveMatchInfo as computeLiveMatchInfo,
  getLiveAverage,
} from "@/app/lib/dashboard/snapshot";

function createCachedMatch(tableNum: number) {
  return unstable_cache(
    async (tournamentId: string, table: string) => {
      return await getCuescoreMatchCached(tournamentId, table);
    },
    [`cachedMatch${tableNum}`],
    { tags: [getMatchCacheTag(tableNum)] }
  );
}

function createCachedMatchInfo(tableNum: number) {
  return unstable_cache(
    async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
      return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
    },
    [`cachedMatchInfo${tableNum}`],
    { tags: [getMatchCacheTag(tableNum)] }
  );
}

function createCachedFirstPlayer(tableNum: number) {
  return unstable_cache(
    async (matchId: string) => {
      return await getMatch(matchId);
    },
    [`cachedFirstPlayer${tableNum}`],
    { tags: [getMatchCacheTag(tableNum)] }
  );
}

const cachedMatches = [1, 2, 3, 4, 5, 6].map(createCachedMatch);
const cachedMatchInfos = [1, 2, 3, 4, 5, 6].map(createCachedMatchInfo);
const cachedFirstPlayers = [1, 2, 3, 4, 5, 6].map(createCachedFirstPlayer);

export async function getDashboardTournamentSnapshot(tournamentId: string) {
  const tableIds = await Promise.all([1, 2, 3, 4, 5, 6].map(getTableIdBySlot));

  const matches = await Promise.all(
    tableIds.map((tableId, i) => cachedMatches[i](tournamentId, tableId))
  );

  const liveStates = await findMatchLiveStates(
    matches
      .map((m) => (m?.matchId ? String(m.matchId) : null))
      .filter((id): id is string => Boolean(id))
  );
  const liveStateByMatchId = new Map(liveStates.map((ls) => [ls.matchId, ls]));

  const tableProjections = await Promise.all(
    matches.map(async (match, i) => {
      const tableNum = i + 1;
      const liveState = match?.matchId ? liveStateByMatchId.get(String(match.matchId)) : null;

      const matchInfo = match?.matchId
        ? liveState
          ? computeLiveMatchInfo(liveState, match)
          : await cachedMatchInfos[i](
              tournamentId,
              String(match.matchId),
              (match?.scoreA || 0) + (match?.scoreB || 0) + 1,
              String(match.playerA.playerId),
              String(match.playerB.playerId)
            )
        : null;

      const firstPlayer = liveState
        ? null
        : match?.matchId
        ? (await cachedFirstPlayers[i](String(match.matchId)))?.firstPlayer
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

      return {
        tableId: tableIds[i],
        match,
        matchInfo,
        liveState,
        firstPlayer,
        matchAvgA,
        matchAvgB,
      };
    })
  );

  return {
    matches: tableProjections.map((t) => t.match),
    matchInfos: tableProjections.map((t) => t.matchInfo),
    liveStates: tableProjections.map((t) => t.liveState),
    tableIds: tableProjections.map((t) => t.tableId),
    firstPlayers: tableProjections.map((t) => t.firstPlayer),
    matchAvgA: tableProjections.map((t) => t.matchAvgA),
    matchAvgB: tableProjections.map((t) => t.matchAvgB),
  };
}