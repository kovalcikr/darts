import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { findMatchAvg, getPlayerThrowInfo } from "@/app/lib/playerThrow";
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

export async function GET(request: NextRequest, { params }: { params: RouteParams<{ id: string }> }) {
    const searchParams = request.nextUrl.searchParams
    const test = searchParams.get('test')

    const { id: tournamentId } = await params;

    const match1 = await cachedMatch1(tournamentId, getTableId('1', test == 'true'));
    const match2 = await cachedMatch2(tournamentId, getTableId('2', test == 'true'));
    const match3 = await cachedMatch3(tournamentId, getTableId('3', test == 'true'));
    const match4 = await cachedMatch4(tournamentId, getTableId('4', test == 'true'));
    const match5 = await cachedMatch5(tournamentId, getTableId('5', test == 'true'));
    const match6 = await cachedMatch6(tournamentId, getTableId('6', test == 'true'));

    const matchInfo1 = match1?.matchId && await cachedMatchInfo1(tournamentId, String(match1.matchId), (match1?.scoreA || 0) + (match1?.scoreB || 0) + 1, match1?.playerA.playerId.toString(), match1?.playerB.playerId.toString());
    const matchInfo2 = match2?.matchId && await cachedMatchInfo2(tournamentId, String(match2.matchId), (match2?.scoreA || 0) + (match2?.scoreB || 0) + 1, match2?.playerA.playerId.toString(), match2?.playerB.playerId.toString());
    const matchInfo3 = match3?.matchId && await cachedMatchInfo3(tournamentId, String(match3.matchId), (match3?.scoreA || 0) + (match3?.scoreB || 0) + 1, match3?.playerA.playerId.toString(), match3?.playerB.playerId.toString());
    const matchInfo4 = match4?.matchId && await cachedMatchInfo4(tournamentId, String(match4.matchId), (match4?.scoreA || 0) + (match4?.scoreB || 0) + 1, match4?.playerA.playerId.toString(), match4?.playerB.playerId.toString());
    const matchInfo5 = match5?.matchId && await cachedMatchInfo5(tournamentId, String(match5.matchId), (match5?.scoreA || 0) + (match5?.scoreB || 0) + 1, match5?.playerA.playerId.toString(), match5?.playerB.playerId.toString());
    const matchInfo6 = match6?.matchId && await cachedMatchInfo6(tournamentId, String(match6.matchId), (match6?.scoreA || 0) + (match6?.scoreB || 0) + 1, match6?.playerA.playerId.toString(), match6?.playerB.playerId.toString());

    const firstPlayer1 = match1?.matchId && (await cachedFirstPlayer1(String(match1.matchId)))?.firstPlayer;
    const firstPlayer2 = match2?.matchId && (await cachedFirstPlayer2(String(match2.matchId)))?.firstPlayer;
    const firstPlayer3 = match3?.matchId && (await cachedFirstPlayer3(String(match3.matchId)))?.firstPlayer;
    const firstPlayer4 = match4?.matchId && (await cachedFirstPlayer4(String(match4.matchId)))?.firstPlayer;
    const firstPlayer5 = match5?.matchId && (await cachedFirstPlayer5(String(match5.matchId)))?.firstPlayer;
    const firstPlayer6 = match6?.matchId && (await cachedFirstPlayer6(String(match6.matchId)))?.firstPlayer;

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
        firstPlayer1: firstPlayer1,
        firstPlayer2: firstPlayer2,
        firstPlayer3: firstPlayer3,
        firstPlayer4: firstPlayer4,
        firstPlayer5: firstPlayer5,
        firstPlayer6: firstPlayer6,
        matchAvgA1: match1?.matchId ? await findMatchAvg(String(match1.matchId), String(match1.playerA.playerId)) : null,
        matchAvgA2: match2?.matchId ? await findMatchAvg(String(match2.matchId), String(match2.playerA.playerId)) : null,
        matchAvgA3: match3?.matchId ? await findMatchAvg(String(match3.matchId), String(match3.playerA.playerId)) : null,
        matchAvgA4: match4?.matchId ? await findMatchAvg(String(match4.matchId), String(match4.playerA.playerId)) : null,
        matchAvgA5: match5?.matchId ? await findMatchAvg(String(match5.matchId), String(match5.playerA.playerId)) : null,
        matchAvgA6: match6?.matchId ? await findMatchAvg(String(match6.matchId), String(match6.playerA.playerId)) : null,
        matchAvgB1: match1?.matchId ? await findMatchAvg(String(match1.matchId), String(match1.playerB.playerId)) : null,
        matchAvgB2: match2?.matchId ? await findMatchAvg(String(match2.matchId), String(match2.playerB.playerId)) : null,
        matchAvgB3: match3?.matchId ? await findMatchAvg(String(match3.matchId), String(match3.playerB.playerId)) : null,
        matchAvgB4: match4?.matchId ? await findMatchAvg(String(match4.matchId), String(match4.playerB.playerId)) : null,
        matchAvgB5: match5?.matchId ? await findMatchAvg(String(match5.matchId), String(match5.playerB.playerId)) : null,
        matchAvgB6: match6?.matchId ? await findMatchAvg(String(match6.matchId), String(match6.playerB.playerId)) : null,
    }

    return new Response(JSON.stringify(match));
}
