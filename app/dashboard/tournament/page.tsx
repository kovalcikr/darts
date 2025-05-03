import getTournamentInfo from '@/app/lib/cuescore';
import { getCuescoreMatch, getCuescoreMatchCached, getMatch, nextPlayer } from '@/app/lib/match';
import Image from 'next/image';
import RefreshWrapper from './refreshWrapper';
import { unstable_cache } from 'next/cache';
import { getPlayerThrowInfo } from '@/app/lib/playerThrow';

export default async function TournamentDashboardPage() {

    const tournamentId = '53005558';


    // const match1 = await unstable_cache(async (tournamentId, tableId) => getCuescoreMatchCached(tournamentId, tableId), null, { tags: ['matches-1'] })(tournamentId, '11');
    // const match2 = await unstable_cache(async (tournamentId, tableId) => getCuescoreMatchCached(tournamentId, tableId), null, { tags: ['matches-2'] })(tournamentId, '12');;
    // const match3 = await unstable_cache(async (tournamentId, tableId) => getCuescoreMatchCached(tournamentId, tableId), null, { tags: ['matches-3'] })(tournamentId, '13');;
    // const match4 = await unstable_cache(async (tournamentId, tableId) => getCuescoreMatchCached(tournamentId, tableId), null, { tags: ['matches-4'] })(tournamentId, '14');;
    // const match5 = await unstable_cache(async (tournamentId, tableId) => getCuescoreMatchCached(tournamentId, tableId), null, { tags: ['matches-5'] })(tournamentId, '15');;
    // const match6 = await unstable_cache(async (tournamentId, tableId) => getCuescoreMatchCached(tournamentId, tableId), null, { tags: ['matches-6'] })(tournamentId, '16');;

    const match1 = await getCuescoreMatchCached(tournamentId, '11');
    const match2 = await getCuescoreMatchCached(tournamentId, '12');;
    const match3 = await getCuescoreMatchCached(tournamentId, '13');;
    const match4 = await getCuescoreMatchCached(tournamentId, '14');;
    const match5 = await getCuescoreMatchCached(tournamentId, '15');;
    const match6 = await getCuescoreMatchCached(tournamentId, '16');;
    console.log("now")


    const matchInfo1 = await getPlayerThrowInfo(tournamentId, match1?.matchId?.toString(), (match1?.scoreA || 0) + (match1?.scoreB || 0) + 1);
    const matchInfo2 = await getPlayerThrowInfo(tournamentId, match2?.matchId?.toString(), (match2?.scoreA || 0) + (match2?.scoreB || 0) + 1);
    const matchInfo3 = await getPlayerThrowInfo(tournamentId, match3?.matchId?.toString(), (match3?.scoreA || 0) + (match3?.scoreB || 0) + 1);
    const matchInfo4 = await getPlayerThrowInfo(tournamentId, match4?.matchId?.toString(), (match4?.scoreA || 0) + (match4?.scoreB || 0) + 1);
    const matchInfo5 = await getPlayerThrowInfo(tournamentId, match5?.matchId?.toString(), (match5?.scoreA || 0) + (match5?.scoreB || 0) + 1);
    const matchInfo6 = await getPlayerThrowInfo(tournamentId, match6?.matchId?.toString(), (match6?.scoreA || 0) + (match6?.scoreB || 0) + 1);

    const firstPlayer1 = match1?.matchId && (await getMatch(match1.matchId.toString()))?.firstPlayer;
    const firstPlayer2 = match2?.matchId && (await getMatch(match2.matchId.toString()))?.firstPlayer;
    const firstPlayer3 = match3?.matchId && (await getMatch(match3.matchId.toString()))?.firstPlayer;
    const firstPlayer4 = match4?.matchId && (await getMatch(match4.matchId.toString()))?.firstPlayer;
    const firstPlayer5 = match5?.matchId && (await getMatch(match5.matchId.toString()))?.firstPlayer;
    const firstPlayer6 = match6?.matchId && (await getMatch(match6.matchId.toString()))?.firstPlayer;

    return (
        <div className="grid grid-cols-3 grid-rows-2 h-screen w-full">
            <RefreshWrapper>
                <TableDashboard tableId="1" match={match1} matchInfo={matchInfo1?.score} lastThrows={matchInfo1?.lastThrows} firstPlayer={firstPlayer1} />
                <TableDashboard tableId="2" match={match2} matchInfo={matchInfo2?.score} lastThrows={matchInfo2?.lastThrows} firstPlayer={firstPlayer2} />
                <TableDashboard tableId="3" match={match3} matchInfo={matchInfo3?.score} lastThrows={matchInfo3?.lastThrows} firstPlayer={firstPlayer3} />
                <TableDashboard tableId="4" match={match4} matchInfo={matchInfo4?.score} lastThrows={matchInfo4?.lastThrows} firstPlayer={firstPlayer4} />
                <TableDashboard tableId="5" match={match5} matchInfo={matchInfo5?.score} lastThrows={matchInfo5?.lastThrows} firstPlayer={firstPlayer5} />
                <TableDashboard tableId="6" match={match6} matchInfo={matchInfo6?.score} lastThrows={matchInfo6?.lastThrows} firstPlayer={firstPlayer6} />
            </RefreshWrapper>
        </div>
    );
};



export function TableDashboard({ tableId, match, matchInfo, lastThrows, firstPlayer }: { tableId: string, match: any, matchInfo: any, lastThrows?: any[], firstPlayer? : string }) {
    function nextPlayer(leg: number, throwsA: number, throwsB: number, playerA: string, playerB: string, firstPlayer: string) {
        if ((leg + (throwsA ? throwsA : 0) + (throwsB ? throwsB : 0)) % 2 == 1) {
          return firstPlayer;
        } else {
          return firstPlayer == playerA ? playerB : playerA;
        }
      }

    const leg = (match?.scoreA || 0) + (match?.scoreB || 0) + 1;
    const playerAInfo = matchInfo?.find(e => e.playerId == match.playerA.playerId.toString())
    const playerBInfo = matchInfo?.find(e => e.playerId == match.playerB.playerId.toString())
    const nextP = nextPlayer(leg, playerAInfo?._count?.score, playerBInfo?._count?.score, match?.playerA?.playerId.toString(), match?.playerB?.playerId.toString(), firstPlayer);
    return (
        <div className="col-span-1 row-span-1 bg-blue-50 p-6 flex flex-col items-center justify-center space-y-6 rounded-lg shadow-md border border-blue-200">
            <div className="w-full flex flex-col items-center space-y-4">
                {/* Table Name */}
                <h1 className="text-2xl font-bold text-blue-800">Table {tableId}</h1>

                <div className="w-full flex justify-between items-center space-x-6">
                    {match && (<>
                        <Player playerId="1" photo={match.playerA.image} playerName={match.playerA.name} legsWon={match.scoreA} score={501 - (playerAInfo?._sum?.score || 0)} lastThrows={lastThrows?.filter(t => t.playerId == match.playerA.playerId.toString())?.map(t => t.score)} active={nextP == match.playerA.playerId.toString()} />

                        <div className="text-center flex-none">
                            <h2 className="text-2xl font-bold text-blue-800">VS</h2>
                        </div>

                        <Player playerId="2" photo={match.playerB.image} playerName={match.playerB.name} legsWon={match.scoreB} score={501 - (playerBInfo?._sum?.score || 0)} lastThrows={lastThrows?.filter(t => t.playerId == match.playerB.playerId.toString())?.map(t => t.score)} active={nextP == match.playerB.playerId.toString()} />
                    </>
                    )}
                </div>
            </div>
        </div>

    );
}

export function Player({ playerId, playerName, photo, active, legsWon, score, lastThrows }: { photo: string, playerId: string, playerName: string, active?: boolean, score: any,  legsWon?: number, lastThrows?: any[]

 }) {
    return (
        <div className={`flex flex-col items-center space-y-4 flex-1 ${active ? "bg-yellow-50" : ""}`}>
            <img
                src={photo}
                alt={`Player ${playerName} - ${playerId}`}
                className="w-28 h-28"
            />
            <h2 className="text-xl text-center px-1 font-bold text-blue-700">{playerName}</h2>
            <div className="text-center">
                <p className="text-xl text-blue-600">Legs Won: <span className="font-semibold text-blue-800 text-2xl">{legsWon}</span></p>
                <p className="text-xl text-blue-600">Leg Score: <span className="font-semibold text-blue-800 text-2xl">{score}</span></p>
            </div>
            <div className="text-center">
                <p className="text-lg font-semibold text-blue-700">Last Throws:</p>
                <p className="text-lg text-blue-600">
                    {lastThrows?.map((throwInfo, index) => (
                        <span key={index} className={index == 0 ? "text-xl font-bold text-blue-800" : ""}>{index != 0 && ", "}{throwInfo}</span>
                    ))}
                </p>
            </div>
        </div>
    )
}