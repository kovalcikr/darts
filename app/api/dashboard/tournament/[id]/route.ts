import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { findMatchAvg, getPlayerThrowInfo } from "@/app/lib/playerThrow";
import { findMatchLiveStates } from "@/app/lib/data";
import { apiError } from "@/app/api/_lib/responses";
import { unstable_cache } from "next/cache";
import { NextRequest } from "next/server";
import type { RouteParams } from "@/app/lib/next-types";

const cachedMatch1 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch1'], {
    tags: ['match11']
});
const cachedMatch2 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch2'], {
    tags: ['match12']
});
const cachedMatch3 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch3'], {
    tags: ['match13']
});
const cachedMatch4 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch4'], {
    tags: ['match14']
});
const cachedMatch5 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch5'], {
    tags: ['match15']
});
const cachedMatch6 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch6'], {
    tags: ['match16']
});
const cachedMatchInfo1 = unstable_cache(async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
}, ['cachedMatchInfo1'], {
    tags: ['match11']
});
const cachedMatchInfo2 = unstable_cache(async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
}, ['cachedMatchInfo2'], {
    tags: ['match12']
});
const cachedMatchInfo3 = unstable_cache(async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
}, ['cachedMatchInfo3'], {
    tags: ['match13']
});
const cachedMatchInfo4 = unstable_cache(async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
}, ['cachedMatchInfo4'], {
    tags: ['match14']
});
const cachedMatchInfo5 = unstable_cache(async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
}, ['cachedMatchInfo5'], {
    tags: ['match15']
});
const cachedMatchInfo6 = unstable_cache(async (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId);
}, ['cachedMatchInfo6'], {
    tags: ['match16']
});
const cachedFirstPlayer1 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer1'], {
    tags: ['match11']
});
const cachedFirstPlayer2 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer2'], {
    tags: ['match12']
});
const cachedFirstPlayer3 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer3'], {
    tags: ['match13']
});
const cachedFirstPlayer4 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer4'], {
    tags: ['match14']
});
const cachedFirstPlayer5 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer5'], {
    tags: ['match15']
});
const cachedFirstPlayer6 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer6'], {
    tags: ['match16']
});

function getTableId(table: string, test: boolean) {
    return (test ? '' : '1') + table
}

function getLiveAverage(liveState, player: 'A' | 'B') {
    const score = player === 'A' ? liveState.playerATotalScore : liveState.playerBTotalScore;
    const darts = player === 'A' ? liveState.playerATotalDarts : liveState.playerBTotalDarts;

    return darts > 0 ? score / darts * 3 : 0;
}

function getLiveMatchInfo(liveState, match) {
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

export async function GET(request: NextRequest, { params }: { params: RouteParams<{ id: string }> }) {
    try {
        const searchParams = request.nextUrl.searchParams
        const test = searchParams.get('test')

        const { id: tournamentId } = await params;

        const match1 = await cachedMatch1(tournamentId, getTableId('1', test == 'true'));
        const match2 = await cachedMatch2(tournamentId, getTableId('2', test == 'true'));
        const match3 = await cachedMatch3(tournamentId, getTableId('3', test == 'true'));
        const match4 = await cachedMatch4(tournamentId, getTableId('4', test == 'true'));
        const match5 = await cachedMatch5(tournamentId, getTableId('5', test == 'true'));
        const match6 = await cachedMatch6(tournamentId, getTableId('6', test == 'true'));

        const liveStates = await findMatchLiveStates(
            [match1, match2, match3, match4, match5, match6]
                .map(match => match?.matchId ? String(match.matchId) : null)
                .filter((matchId): matchId is string => Boolean(matchId))
        );
        const liveStateByMatchId = new Map(liveStates.map(liveState => [liveState.matchId, liveState]));
        const liveState1 = match1?.matchId ? liveStateByMatchId.get(String(match1.matchId)) : null;
        const liveState2 = match2?.matchId ? liveStateByMatchId.get(String(match2.matchId)) : null;
        const liveState3 = match3?.matchId ? liveStateByMatchId.get(String(match3.matchId)) : null;
        const liveState4 = match4?.matchId ? liveStateByMatchId.get(String(match4.matchId)) : null;
        const liveState5 = match5?.matchId ? liveStateByMatchId.get(String(match5.matchId)) : null;
        const liveState6 = match6?.matchId ? liveStateByMatchId.get(String(match6.matchId)) : null;

        const matchInfo1 = match1?.matchId && (liveState1 ? getLiveMatchInfo(liveState1, match1) : await cachedMatchInfo1(tournamentId, String(match1.matchId), (match1?.scoreA || 0) + (match1?.scoreB || 0) + 1, match1?.playerA.playerId.toString(), match1?.playerB.playerId.toString()));
        const matchInfo2 = match2?.matchId && (liveState2 ? getLiveMatchInfo(liveState2, match2) : await cachedMatchInfo2(tournamentId, String(match2.matchId), (match2?.scoreA || 0) + (match2?.scoreB || 0) + 1, match2?.playerA.playerId.toString(), match2?.playerB.playerId.toString()));
        const matchInfo3 = match3?.matchId && (liveState3 ? getLiveMatchInfo(liveState3, match3) : await cachedMatchInfo3(tournamentId, String(match3.matchId), (match3?.scoreA || 0) + (match3?.scoreB || 0) + 1, match3?.playerA.playerId.toString(), match3?.playerB.playerId.toString()));
        const matchInfo4 = match4?.matchId && (liveState4 ? getLiveMatchInfo(liveState4, match4) : await cachedMatchInfo4(tournamentId, String(match4.matchId), (match4?.scoreA || 0) + (match4?.scoreB || 0) + 1, match4?.playerA.playerId.toString(), match4?.playerB.playerId.toString()));
        const matchInfo5 = match5?.matchId && (liveState5 ? getLiveMatchInfo(liveState5, match5) : await cachedMatchInfo5(tournamentId, String(match5.matchId), (match5?.scoreA || 0) + (match5?.scoreB || 0) + 1, match5?.playerA.playerId.toString(), match5?.playerB.playerId.toString()));
        const matchInfo6 = match6?.matchId && (liveState6 ? getLiveMatchInfo(liveState6, match6) : await cachedMatchInfo6(tournamentId, String(match6.matchId), (match6?.scoreA || 0) + (match6?.scoreB || 0) + 1, match6?.playerA.playerId.toString(), match6?.playerB.playerId.toString()));

        const firstPlayer1 = liveState1 ? null : (match1?.matchId && (await cachedFirstPlayer1(String(match1.matchId)))?.firstPlayer);
        const firstPlayer2 = liveState2 ? null : (match2?.matchId && (await cachedFirstPlayer2(String(match2.matchId)))?.firstPlayer);
        const firstPlayer3 = liveState3 ? null : (match3?.matchId && (await cachedFirstPlayer3(String(match3.matchId)))?.firstPlayer);
        const firstPlayer4 = liveState4 ? null : (match4?.matchId && (await cachedFirstPlayer4(String(match4.matchId)))?.firstPlayer);
        const firstPlayer5 = liveState5 ? null : (match5?.matchId && (await cachedFirstPlayer5(String(match5.matchId)))?.firstPlayer);
        const firstPlayer6 = liveState6 ? null : (match6?.matchId && (await cachedFirstPlayer6(String(match6.matchId)))?.firstPlayer);

        const match = {
            match1: match1,
            match2: match2,
            match3: match3,
            match4: match4,
            match5: match5,
            match6: match6,
            matchInfo1: matchInfo1,
            matchInfo2: matchInfo2,
            matchInfo3: matchInfo3,
            matchInfo4: matchInfo4,
            matchInfo5: matchInfo5,
            matchInfo6: matchInfo6,
            liveState1: liveState1,
            liveState2: liveState2,
            liveState3: liveState3,
            liveState4: liveState4,
            liveState5: liveState5,
            liveState6: liveState6,
            firstPlayer1: firstPlayer1,
            firstPlayer2: firstPlayer2,
            firstPlayer3: firstPlayer3,
            firstPlayer4: firstPlayer4,
            firstPlayer5: firstPlayer5,
            firstPlayer6: firstPlayer6,
            matchAvgA1: liveState1 ? getLiveAverage(liveState1, 'A') : (match1?.matchId ? await findMatchAvg(String(match1.matchId), String(match1.playerA.playerId)) : null),
            matchAvgA2: liveState2 ? getLiveAverage(liveState2, 'A') : (match2?.matchId ? await findMatchAvg(String(match2.matchId), String(match2.playerA.playerId)) : null),
            matchAvgA3: liveState3 ? getLiveAverage(liveState3, 'A') : (match3?.matchId ? await findMatchAvg(String(match3.matchId), String(match3.playerA.playerId)) : null),
            matchAvgA4: liveState4 ? getLiveAverage(liveState4, 'A') : (match4?.matchId ? await findMatchAvg(String(match4.matchId), String(match4.playerA.playerId)) : null),
            matchAvgA5: liveState5 ? getLiveAverage(liveState5, 'A') : (match5?.matchId ? await findMatchAvg(String(match5.matchId), String(match5.playerA.playerId)) : null),
            matchAvgA6: liveState6 ? getLiveAverage(liveState6, 'A') : (match6?.matchId ? await findMatchAvg(String(match6.matchId), String(match6.playerA.playerId)) : null),
            matchAvgB1: liveState1 ? getLiveAverage(liveState1, 'B') : (match1?.matchId ? await findMatchAvg(String(match1.matchId), String(match1.playerB.playerId)) : null),
            matchAvgB2: liveState2 ? getLiveAverage(liveState2, 'B') : (match2?.matchId ? await findMatchAvg(String(match2.matchId), String(match2.playerB.playerId)) : null),
            matchAvgB3: liveState3 ? getLiveAverage(liveState3, 'B') : (match3?.matchId ? await findMatchAvg(String(match3.matchId), String(match3.playerB.playerId)) : null),
            matchAvgB4: liveState4 ? getLiveAverage(liveState4, 'B') : (match4?.matchId ? await findMatchAvg(String(match4.matchId), String(match4.playerB.playerId)) : null),
            matchAvgB5: liveState5 ? getLiveAverage(liveState5, 'B') : (match5?.matchId ? await findMatchAvg(String(match5.matchId), String(match5.playerB.playerId)) : null),
            matchAvgB6: liveState6 ? getLiveAverage(liveState6, 'B') : (match6?.matchId ? await findMatchAvg(String(match6.matchId), String(match6.playerB.playerId)) : null),
        }

        return Response.json(match);
    } catch (error) {
        console.error('Failed to load dashboard tournament snapshot', { error });
        return apiError('DASHBOARD_TOURNAMENT_FETCH_FAILED', 'Unable to load dashboard tournament snapshot', { status: 500 });
    }
}
