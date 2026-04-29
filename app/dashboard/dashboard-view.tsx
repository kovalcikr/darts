'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

async function fetchServerData(test) {
    const response = await fetch(`/api/dashboard${test ? `?test=${test}` : ''}`);
    if (!response.ok) {
        throw new Error('Failed to fetch server data');
    }
    return response.json();
}

export default function DashboardView() {
    const searchParams = useSearchParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const serverData = await fetchServerData(searchParams.get('test'));
                setData(serverData);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchData(); // Initial fetch
        intervalId = setInterval(fetchData, 1000); // Poll every second

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [searchParams]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="grid grid-cols-3 grid-rows-2 h-screen w-full bg-gray-900 text-gray-300">
            <TableDashboard tableId="1" match={data?.match1} matchInfo={data?.matchInfo1?.score} lastThrows={data?.matchInfo1?.lastThrows} liveState={data?.liveState1} firstPlayer={data?.firstPlayer1} avgPlayerA={data?.matchAvgA1} avgPlayerB={data?.matchAvgB1} />
            <TableDashboard tableId="2" match={data?.match2} matchInfo={data?.matchInfo2?.score} lastThrows={data?.matchInfo2?.lastThrows} liveState={data?.liveState2} firstPlayer={data?.firstPlayer2} avgPlayerA={data?.matchAvgA2} avgPlayerB={data?.matchAvgB2} />
            <TableDashboard tableId="3" match={data?.match3} matchInfo={data?.matchInfo3?.score} lastThrows={data?.matchInfo3?.lastThrows} liveState={data?.liveState3} firstPlayer={data?.firstPlayer3} avgPlayerA={data?.matchAvgA3} avgPlayerB={data?.matchAvgB3} />
            <TableDashboard tableId="4" match={data?.match4} matchInfo={data?.matchInfo4?.score} lastThrows={data?.matchInfo4?.lastThrows} liveState={data?.liveState4} firstPlayer={data?.firstPlayer4} avgPlayerA={data?.matchAvgA4} avgPlayerB={data?.matchAvgB4} />
            <TableDashboard tableId="5" match={data?.match5} matchInfo={data?.matchInfo5?.score} lastThrows={data?.matchInfo5?.lastThrows} liveState={data?.liveState5} firstPlayer={data?.firstPlayer5} avgPlayerA={data?.matchAvgA5} avgPlayerB={data?.matchAvgB5} />
            <TableDashboard tableId="6" match={data?.match6} matchInfo={data?.matchInfo6?.score} lastThrows={data?.matchInfo6?.lastThrows} liveState={data?.liveState6} firstPlayer={data?.firstPlayer6} avgPlayerA={data?.matchAvgA6} avgPlayerB={data?.matchAvgB6} />
        </div>
    );
}

function formatAverage(totalScore: number, totalDarts: number) {
    return totalDarts > 0 ? (totalScore / totalDarts * 3).toFixed(1) : null;
}

function formatAverageValue(average?: number) {
    return average && average > 0 ? average.toFixed(1) : null;
}

function TableDashboard({ tableId, match, matchInfo, lastThrows, liveState, firstPlayer, avgPlayerA, avgPlayerB }: { tableId: string, match: any, matchInfo: any, lastThrows?: any[], liveState?: any, firstPlayer?: string, avgPlayerA?: number, avgPlayerB?: number }) {
    function nextPlayer(leg: number, throwsA: number, throwsB: number, playerA: string, playerB: string, firstPlayer: string) {
        if ((leg + (throwsA ? throwsA : 0) + (throwsB ? throwsB : 0)) % 2 == 1) {
            return firstPlayer;
        } else {
            return firstPlayer == playerA ? playerB : playerA;
        }
    }

    const leg = (match?.scoreA || 0) + (match?.scoreB || 0) + 1;
    const playerAId = match?.playerA?.playerId?.toString();
    const playerBId = match?.playerB?.playerId?.toString();
    const playerAInfo = matchInfo?.find(e => e.playerId == playerAId)
    const playerBInfo = matchInfo?.find(e => e.playerId == playerBId)
    const fallbackNextPlayer = match && firstPlayer ? nextPlayer(leg, playerAInfo?._count?.score, playerBInfo?._count?.score, playerAId, playerBId, firstPlayer) : null;
    const nextP = liveState?.activePlayerId ?? fallbackNextPlayer;
    const projectedLastThrows = Array.isArray(liveState?.lastThrows) ? liveState.lastThrows : null;
    const currentLastThrows = projectedLastThrows ?? lastThrows;
    const playerAScore = liveState ? liveState.playerAScoreLeft : 501 - (playerAInfo?._sum?.score || 0);
    const playerBScore = liveState ? liveState.playerBScoreLeft : 501 - (playerBInfo?._sum?.score || 0);
    const playerAAvgDisplay = liveState ? formatAverage(liveState.playerATotalScore, liveState.playerATotalDarts) : formatAverageValue(avgPlayerA);
    const playerBAvgDisplay = liveState ? formatAverage(liveState.playerBTotalScore, liveState.playerBTotalDarts) : formatAverageValue(avgPlayerB);
    return (
        <div className="relative bg-gray-800 p-2 md:p-4 rounded-xl shadow-lg ring-1 ring-white/10 flex flex-col items-center justify-center space-y-2 md:space-y-4">
            <h1 className="absolute top-2 left-2 text-xs md:text-sm font-bold text-gray-500">#{tableId}</h1>
            <div className="w-full flex flex-col items-center space-y-2">
                <div className="w-full flex flex-col sm:flex-row justify-around items-center sm:space-y-4 sm:space-x-2 md:space-x-4">
                    {match && (<>
                        {match.raceTo != match.scoreA && match.raceTo != match.scoreB && (<>
                            <Player playerId="1" photo={match.playerA.image} playerName={match.playerA.name} legsWon={match.scoreA} score={playerAScore} lastThrows={currentLastThrows?.filter(t => t.playerId == playerAId)?.map(t => t.score)} average={playerAAvgDisplay} active={nextP == playerAId} />

                            <div className="text-center flex-none my-2 sm:my-0">
                                <h2 className="text-lg md:text-2xl font-bold text-sky-400">VS</h2>
                            </div>

                            <Player playerId="2" photo={match.playerB.image} playerName={match.playerB.name} legsWon={match.scoreB} score={playerBScore} lastThrows={currentLastThrows?.filter(t => t.playerId == playerBId)?.map(t => t.score)} average={playerBAvgDisplay} active={nextP == playerBId} />
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

function Player({ playerId, playerName, photo, active, legsWon, score, lastThrows, average }: {
    photo: string, playerId: string, playerName: string, active?: boolean, score: any, legsWon?: number, lastThrows?: any[], average?: string

}) {
    return (
        <div className={`flex flex-col items-center space-y-2 flex-1 p-1 md:p-2 rounded-lg ${active ? "bg-sky-900/50 ring-1 ring-sky-500" : ""}`}>
            <img
                src={photo}
                alt={`Player ${playerName} - ${playerId}`}
                width={80}
                height={80}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full hidden md:block"
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
            {average && (
                <p className="text-sm md:text-lg text-gray-400 mt-1">
                    Average: <span className="font-semibold text-white">{average}</span>
                </p>
            )}
        </div>
    )
}
