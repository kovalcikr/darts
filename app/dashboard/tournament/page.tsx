'use client';

import { useEffect, useState } from 'react';



async function fetchServerData() {
    const response = await fetch('/api/dashboard/tournament/53010448');
    if (!response.ok) {
        throw new Error('Failed to fetch server data');
    }
    return response.json();
}

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const serverData = await fetchServerData();
                setData(serverData);
                console.log(serverData);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchData(); // Initial fetch
        intervalId = setInterval(fetchData, 1000); // Poll every second

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="grid grid-cols-3 grid-rows-2 h-screen w-full">
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
        <div className="col-span-1 row-span-1 bg-blue-50 p-6 flex flex-col items-center justify-center space-y-6 rounded-lg shadow-md border border-blue-200">
            <div className="w-full flex flex-col items-center space-y-4">
                {/* Table Name */}
                <h1 className="text-2xl font-bold text-blue-800">Table {tableId}</h1>

                <div className="w-full flex justify-between items-center space-x-6">
                    {match && (<>
                        {match.raceTo != match.scoreA && match.raceTo != match.scoreB && (<>
                            <Player playerId="1" photo={match.playerA.image} playerName={match.playerA.name} legsWon={match.scoreA} score={501 - (playerAInfo?._sum?.score || 0)} lastThrows={lastThrows?.filter(t => t.playerId == match.playerA.playerId.toString())?.map(t => t.score)} active={nextP == match.playerA.playerId.toString()} />

                            <div className="text-center flex-none">
                                <h2 className="text-2xl font-bold text-blue-800">VS</h2>
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
        <div className="flex flex-col items-center justify-center space-y-2 w-full h-full">
            <img
                src={image}
                alt={`Winner` + player}
                className="w-32 h-32 object-cover"
            />
            <p className="text-2xl font-semibold text-blue-800">{ player }</p>
            <p className="text-xl font-bold text-blue-600">Winner</p>
        </div>
    );
}

function Player({ playerId, playerName, photo, active, legsWon, score, lastThrows }: {
    photo: string, playerId: string, playerName: string, active?: boolean, score: any, legsWon?: number, lastThrows?: any[]

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