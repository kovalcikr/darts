'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

async function fetchServerData(tournamentId, test) {
    const response = await fetch(`/api/dashboard/tournament/${tournamentId}${test ? `?test=${test}` : ''}`);
    if (!response.ok) {
        throw new Error('Failed to fetch server data');
    }
    return response.json();
}

export default function DashboardPage({ params }: { params: { tournamentId: string } }) {
    const searchParams = useSearchParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const serverData = await fetchServerData(params.tournamentId, searchParams.get('test'));
                setData(serverData);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchData(); // Initial fetch
        intervalId = setInterval(fetchData, 1000); // Poll every second

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [params.tournamentId, searchParams]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="grid grid-cols-3 grid-rows-2 h-screen w-full bg-gray-900 text-gray-300">
            <TableDashboard tableId="1" match={data?.match1} matchInfo={data?.matchInfo1?.score} lastThrows={data?.matchInfo1?.lastThrows} firstPlayer={data?.firstPlayer1} />
            <TableDashboard tableId="2" match={data?.match2} matchInfo={data?.matchInfo2?.score} lastThrows={data?.matchInfo2?.lastThrows} firstPlayer={data?.firstPlayer2} />
            <TableDashboard tableId="3" match={data?.match3} matchInfo={data?.matchInfo3?.score} lastThrows={data?.matchInfo3?.lastThrows} firstPlayer={data?.firstPlayer3} />
            <TableDashboard tableId="4" match={data?.match4} matchInfo={data?.matchInfo4?.score} lastThrows={data?.matchInfo4?.lastThrows} firstPlayer={data?.firstPlayer4} />
            <TableDashboard tableId="5" match={data?.match5} matchInfo={data?.matchInfo5?.score} lastThrows={data?.matchInfo5?.lastThrows} firstPlayer={data?.firstPlayer5} />
            <TableDashboard tableId="6" match={data?.match6} matchInfo={data?.matchInfo6?.score} lastThrows={data?.matchInfo6?.lastThrows} firstPlayer={data?.firstPlayer6} />
        </div>
    );
}

function TableDashboard({ tableId, match, matchInfo, lastThrows, firstPlayer }: { tableId: string, match: any, matchInfo: any, lastThrows?: any[], firstPlayer?: string }) {
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
        <div className="bg-gray-800 p-2 md:p-4 rounded-xl shadow-lg ring-1 ring-white/10 flex flex-col items-center justify-center space-y-2 md:space-y-4">
            <div className="w-full flex flex-col items-center space-y-2">
                {/* Table Name */}
                <h1 className="text-lg md:text-2xl font-bold text-white">Table {tableId}</h1>

                <div className="w-full flex justify-around items-center space-x-2 md:space-x-4">
                    {match && (<>
                        {match.raceTo != match.scoreA && match.raceTo != match.scoreB && (<>
                            <Player playerId="1" photo={match.playerA.image} playerName={match.playerA.name} legsWon={match.scoreA} score={501 - (playerAInfo?._sum?.score || 0)} lastThrows={lastThrows?.filter(t => t.playerId == match.playerA.playerId.toString())?.map(t => t.score)} active={nextP == match.playerA.playerId.toString()} />

                            <div className="text-center flex-none">
                                <h2 className="text-lg md:text-2xl font-bold text-sky-400">VS</h2>
                            </div>

                            <Player playerId="2" photo={match.playerB.image} playerName={match.playerB.name} legsWon={match.scoreB} score={501 - (playerBInfo?._sum?.score || 0)} lastThrows={lastThrows?.filter(t => t.playerId == match.playerB.playerId.toString())?.map(t => t.score)} active={nextP == match.playerB.playerId.toString()} />
                        </>)
                        }
                        {match.raceTo == match.scoreA && (
                            <Winner
                                player={match.playerA.name}
                                image={match.playerA.image}
                            />
                        )}
                        {match.raceTo == match.scoreB && (
                            <Winner
                                player={match.playerB.name}
                                image={match.playerB.image}
                            />
                        )}
                    </>
                    )}
                </div>
            </div>
        </div>

    );
}

function Winner({ player, image }: { player: string, image: string }) {
    return (
        <div className="flex flex-col items-center justify-center space-y-1 md:space-y-2 w-full h-full">
            <img
                src={image}
                alt={`Winner: ${player}`}
                width={128}
                height={128}
                className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-full"
            />
            <p className="text-lg md:text-2xl font-semibold text-white text-center">{player}</p>
            <p className="text-md md:text-xl font-bold text-sky-400">Winner</p>
        </div>
    );
}

function Player({ playerId, playerName, photo, active, legsWon, score, lastThrows }: {
    photo: string, playerId: string, playerName: string, active?: boolean, score: any, legsWon?: number, lastThrows?: any[]

}) {
    return (
        <div className={`flex flex-col items-center space-y-2 flex-1 p-1 md:p-2 rounded-lg ${active ? "bg-sky-900/50 ring-1 ring-sky-500" : ""}`}>
            <img
                src={photo}
                alt={`Player ${playerName} - ${playerId}`}
                width={112}
                height={112}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full hidden sm:block"
            />
            <h2 className="text-sm md:text-xl text-center px-1 font-bold text-white">{playerName}</h2>
            <div className="text-center">
                <p className="text-sm md:text-xl text-gray-400">Legs: <span className="font-semibold text-white text-md md:text-2xl">{legsWon}</span></p>
                <p className="text-sm md:text-xl text-gray-400">Score: <span className="font-semibold text-white text-md md:text-2xl">{score}</span></p>
            </div>
            <div className="text-center">
                <p className="text-xs md:text-lg font-semibold text-gray-400">Throws:</p>
                <p className="text-xs md:text-lg text-gray-300">
                    {lastThrows?.map((throwInfo, index) => (
                        <span key={index} className={index == 0 ? "text-sm md:text-xl font-bold text-white" : ""}>{index != 0 && ", "}{throwInfo}</span>
                    ))}
                </p>
            </div>
        </div>
    )
}