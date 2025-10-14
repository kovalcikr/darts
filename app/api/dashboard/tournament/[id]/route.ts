import { getCuescoreMatchCached, getMatch } from "@/app/lib/match";
import { getPlayerThrowInfo } from "@/app/lib/playerThrow";
import { unstable_cache } from "next/cache";
import { NextRequest } from "next/server";

const tablesForCache = ['1', '2', '3', '4', '5', '6', '11', '12', '13', '14', '15', '16'];
const cachedMatches: { [key: string]: (tournamentId: string) => Promise<any> } = {};
const cachedMatchInfos: { [key: string]: (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => Promise<any> } = {};
const cachedFirstPlayers: { [key: string]: (matchId: string) => Promise<any> } = {};

tablesForCache.forEach(table => {
    cachedMatches[table] = unstable_cache(
        (tournamentId: string) => getCuescoreMatchCached(tournamentId, table),
        ['cachedMatch', table],
        { tags: [`match${table}`] }
    );
    cachedMatchInfos[table] = unstable_cache(
        (tournamentId: string, matchId: string, leg: number, playerAId: string, playerBId: string) => getPlayerThrowInfo(tournamentId, matchId, leg, playerAId, playerBId),
        ['cachedMatchInfo', table],
        { tags: [`match${table}`] }
    );
    cachedFirstPlayers[table] = unstable_cache(
        (matchId: string) => getMatch(matchId),
        ['cachedFirstPlayer', table],
        { tags: [`match${table}`] }
    );
});

function getTableId(table: string, test: boolean) {
    return (test ? '' : '1') + table
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const searchParams = request.nextUrl.searchParams
    const test = searchParams.get('test')

    const tournamentId = params.id;
    const tables = ['1', '2', '3', '4', '5', '6'];

    const matches = await Promise.all(tables.map(async (table) => {
        const tableId = getTableId(table, test == 'true');
        const match = await cachedMatches[tableId](tournamentId);
        const matchInfo = match?.matchId && await cachedMatchInfos[tableId](tournamentId, match?.matchId?.toString(), (match?.scoreA || 0) + (match?.scoreB || 0) + 1, match?.playerA.playerId.toString(), match?.playerB.playerId.toString());
        const firstPlayer = match?.matchId && (await cachedFirstPlayers[tableId](match.matchId.toString()))?.firstPlayer;

        return {
            [`match${table}`]: match,
            [`matchInfo${table}`]: matchInfo,
            [`firstPlayer${table}`]: firstPlayer
        };
    }));

    const response = matches.reduce((acc, curr) => ({ ...acc, ...curr }), {});

    return new Response(JSON.stringify(response));
}