import { unstable_cache } from "next/cache";

import { findMatchLiveStates } from "@/app/lib/match-live-state";
import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { findMatchAvg, getPlayerThrowInfo } from "@/app/lib/playerThrow";
import { getTableIdBySlot } from "@/app/lib/table-mappings";

const SLOTS = [1, 2, 3, 4, 5, 6];

const cachedMatch = SLOTS.map(slot =>
  unstable_cache(
    (tid: string, table: string) => getCuescoreMatchCached(tid, table),
    [`cachedMatch${slot}`],
    { tags: [`match${slot}`] }
  )
);

const cachedMatchInfo = SLOTS.map(slot =>
  unstable_cache(
    (tid: string, mid: string, leg: number, a: string, b: string) =>
      getPlayerThrowInfo(tid, mid, leg, a, b),
    [`cachedMatchInfo${slot}`],
    { tags: [`match${slot}`] }
  )
);

const cachedFirstPlayer = SLOTS.map(slot =>
  unstable_cache(
    (mid: string) => getMatch(mid),
    [`cachedFirstPlayer${slot}`],
    { tags: [`match${slot}`] }
  )
);

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
  const tableIds = await Promise.all(SLOTS.map(s => getTableIdBySlot(s)));
  const matches = await Promise.all(
    SLOTS.map((_, i) => cachedMatch[i](tournamentId, tableIds[i]))
  );
  const matchIds = matches.map(m => m?.matchId ? String(m.matchId) : null);
  const liveStates = await findMatchLiveStates(
    matchIds.filter((id): id is string => Boolean(id))
  );
  const liveByMid = new Map(liveStates.map(ls => [ls.matchId, ls]));

  const slotData = await Promise.all(
    SLOTS.map(async (slot, i) => {
      const match = matches[i];
      const liveState = match?.matchId ? liveByMid.get(String(match.matchId)) ?? null : null;

      const matchInfo = match?.matchId
        ? liveState
          ? getLiveMatchInfo(liveState, match)
          : await cachedMatchInfo[i](
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
          ? (await cachedFirstPlayer[i](String(match.matchId)))?.firstPlayer ?? null
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

      return { match, matchInfo, liveState, firstPlayer, matchAvgA, matchAvgB };
    })
  );

  return {
    match1: slotData[0].match,
    match2: slotData[1].match,
    match3: slotData[2].match,
    match4: slotData[3].match,
    match5: slotData[4].match,
    match6: slotData[5].match,
    matchInfo1: slotData[0].matchInfo,
    matchInfo2: slotData[1].matchInfo,
    matchInfo3: slotData[2].matchInfo,
    matchInfo4: slotData[3].matchInfo,
    matchInfo5: slotData[4].matchInfo,
    matchInfo6: slotData[5].matchInfo,
    liveState1: slotData[0].liveState,
    liveState2: slotData[1].liveState,
    liveState3: slotData[2].liveState,
    liveState4: slotData[3].liveState,
    liveState5: slotData[4].liveState,
    liveState6: slotData[5].liveState,
    firstPlayer1: slotData[0].firstPlayer,
    firstPlayer2: slotData[1].firstPlayer,
    firstPlayer3: slotData[2].firstPlayer,
    firstPlayer4: slotData[3].firstPlayer,
    firstPlayer5: slotData[4].firstPlayer,
    firstPlayer6: slotData[5].firstPlayer,
    matchAvgA1: slotData[0].matchAvgA,
    matchAvgA2: slotData[1].matchAvgA,
    matchAvgA3: slotData[2].matchAvgA,
    matchAvgA4: slotData[3].matchAvgA,
    matchAvgA5: slotData[4].matchAvgA,
    matchAvgA6: slotData[5].matchAvgA,
    matchAvgB1: slotData[0].matchAvgB,
    matchAvgB2: slotData[1].matchAvgB,
    matchAvgB3: slotData[2].matchAvgB,
    matchAvgB4: slotData[3].matchAvgB,
    matchAvgB5: slotData[4].matchAvgB,
    matchAvgB6: slotData[5].matchAvgB,
  };
}
