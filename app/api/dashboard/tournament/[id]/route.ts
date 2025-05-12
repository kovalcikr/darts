import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { getPlayerThrowInfo } from "@/app/lib/playerThrow";
import { unstable_cache } from "next/cache";
import { NextRequest } from "next/server";

const cachedMatch1 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch1'], {
    tags: ['match1']
});
const cachedMatch2 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch2'], {
    tags: ['match2']
});
const cachedMatch3 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch3'], {
    tags: ['match3']
});
const cachedMatch4 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch4'], {
    tags: ['match4']
});
const cachedMatch5 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch5'], {
    tags: ['match5']
});
const cachedMatch6 = unstable_cache(async (tournamentId: string, table: string) => {
    return await getCuescoreMatchCached(tournamentId, table);
}, ['cachedMatch6'], {
    tags: ['match6']
});
const cachedMatchInfo1 = unstable_cache(async (tournamentId: string, matchId: string, leg: number) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg);
}, ['cachedMatchInfo1'], {
    tags: ['match1']
});
const cachedMatchInfo2 = unstable_cache(async (tournamentId: string, matchId: string, leg: number) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg);
}, ['cachedMatchInfo2'], {
    tags: ['match2']
});
const cachedMatchInfo3 = unstable_cache(async (tournamentId: string, matchId: string, leg: number) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg);
}, ['cachedMatchInfo3'], {
    tags: ['match3']
});
const cachedMatchInfo4 = unstable_cache(async (tournamentId: string, matchId: string, leg: number) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg);
}, ['cachedMatchInfo4'], {
    tags: ['match4']
});
const cachedMatchInfo5 = unstable_cache(async (tournamentId: string, matchId: string, leg: number) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg);
}, ['cachedMatchInfo5'], {
    tags: ['match5']
});
const cachedMatchInfo6 = unstable_cache(async (tournamentId: string, matchId: string, leg: number) => {
    return await getPlayerThrowInfo(tournamentId, matchId, leg);
}, ['cachedMatchInfo6'], {
    tags: ['match6']
});
const cachedFirstPlayer1 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer1'], {
    tags: ['match1']
});
const cachedFirstPlayer2 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer2'], {
    tags: ['match2']
});
const cachedFirstPlayer3 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer3'], {
    tags: ['match3']
});
const cachedFirstPlayer4 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer4'], {
    tags: ['match4']
});
const cachedFirstPlayer5 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer5'], {
    tags: ['match5']
});
const cachedFirstPlayer6 = unstable_cache(async (matchId: string) => {
    return await getMatch(matchId);
}, ['cachedFirstPlayer6'], {
    tags: ['match6']
});

function getTableId(table: string, test: boolean) {
    return (test ? '' : '1') + table 
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const searchParams = request.nextUrl.searchParams
    const test = searchParams.get('test')

    const tournamentId = params.id;

    const match1 = await cachedMatch1(tournamentId, getTableId('1', test == 'true'));
    const match2 = await cachedMatch2(tournamentId, getTableId('2', test == 'true'));
    const match3 = await cachedMatch3(tournamentId, getTableId('3', test == 'true'));
    const match4 = await cachedMatch4(tournamentId, getTableId('4', test == 'true'));
    const match5 = await cachedMatch5(tournamentId, getTableId('5', test == 'true'));
    const match6 = await cachedMatch6(tournamentId, getTableId('6', test == 'true'));

    const matchInfo1 = match1?.matchId && await cachedMatchInfo1(tournamentId, match1?.matchId?.toString(), (match1?.scoreA || 0) + (match1?.scoreB || 0) + 1);
    const matchInfo2 = match2?.matchId && await cachedMatchInfo2(tournamentId, match2?.matchId?.toString(), (match2?.scoreA || 0) + (match2?.scoreB || 0) + 1);
    const matchInfo3 = match3?.matchId && await cachedMatchInfo3(tournamentId, match3?.matchId?.toString(), (match3?.scoreA || 0) + (match3?.scoreB || 0) + 1);
    const matchInfo4 = match4?.matchId && await cachedMatchInfo4(tournamentId, match4?.matchId?.toString(), (match4?.scoreA || 0) + (match4?.scoreB || 0) + 1);
    const matchInfo5 = match5?.matchId && await cachedMatchInfo5(tournamentId, match5?.matchId?.toString(), (match5?.scoreA || 0) + (match5?.scoreB || 0) + 1);
    const matchInfo6 = match6?.matchId && await cachedMatchInfo6(tournamentId, match6?.matchId?.toString(), (match6?.scoreA || 0) + (match6?.scoreB || 0) + 1);

    const firstPlayer1 = match1?.matchId && (await cachedFirstPlayer1(match1.matchId.toString()))?.firstPlayer;
    const firstPlayer2 = match2?.matchId && (await cachedFirstPlayer2(match2.matchId.toString()))?.firstPlayer;
    const firstPlayer3 = match3?.matchId && (await cachedFirstPlayer3(match3.matchId.toString()))?.firstPlayer;
    const firstPlayer4 = match4?.matchId && (await cachedFirstPlayer4(match4.matchId.toString()))?.firstPlayer;
    const firstPlayer5 = match5?.matchId && (await cachedFirstPlayer5(match5.matchId.toString()))?.firstPlayer;
    const firstPlayer6 = match6?.matchId && (await cachedFirstPlayer6(match6.matchId.toString()))?.firstPlayer;
    
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
        firstPlayer6: firstPlayer6
    }

    return new Response(JSON.stringify(match));
}