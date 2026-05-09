'use client';

import { useEffect, useState } from 'react';
import NoActiveTournament from '@/app/components/NoActiveTournament';
import DartIcon from '@/app/components/DartIcon';
import type { DashboardSnapshot } from '@/app/lib/dashboard/snapshot';
import type { MatchLiveState } from '@/app/lib/match-live-state/model';
import type { CueScoreMatch } from '@/app/lib/integrations/cuescore/types';
import { fetchDashboardSnapshot } from './actions';

export default function DashboardView() {
    const [data, setData] = useState<DashboardSnapshot | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inactive, setInactive] = useState(false);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const result = await fetchDashboardSnapshot();
                setError(null);

                if (result === null) {
                    setData(null);
                    setInactive(true);
                    return;
                }

                setData(result);
                setInactive(false);
            } catch (err) {
                setError(err.message);
                setInactive(false);
            }
        };

        fetchData(); // Initial fetch
        intervalId = setInterval(fetchData, 1000); // Poll every second

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);

    if (inactive) {
        return <NoActiveTournament title="No active tournaments" />;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="grid grid-cols-3 grid-rows-2 h-screen w-full bg-gray-900 text-gray-300">
            {data && data.matches.map((match, i) => (
                <TableDashboard
                    key={i}
                    tableId={String(i + 1)}
                    match={match}
                    liveState={data.liveStates[i]}
                />
            ))}
        </div>
    );
}

function formatAverage(totalScore: number, totalDarts: number) {
    return totalDarts > 0 ? (totalScore / totalDarts * 3).toFixed(1) : null;
}

function TableDashboard({ tableId, match, liveState }: {
    tableId: string
    match: CueScoreMatch | null
    liveState: MatchLiveState | null
}) {
    const leg = (match?.scoreA || 0) + (match?.scoreB || 0) + 1;
    const playerAId = match?.playerA?.playerId?.toString();
    const playerBId = match?.playerB?.playerId?.toString();

    const nextP = liveState?.activePlayerId ?? null;
    const currentLastThrows = liveState?.lastThrows ?? [];
    const playerAScore = liveState?.playerAScoreLeft ?? 501;
    const playerBScore = liveState?.playerBScoreLeft ?? 501;
    const playerAAvgDisplay = liveState ? formatAverage(liveState.playerATotalScore, liveState.playerATotalDarts) : null;
    const playerBAvgDisplay = liveState ? formatAverage(liveState.playerBTotalScore, liveState.playerBTotalDarts) : null;
    const startingPlayerId = liveState?.startingPlayerId ?? null;

    return (
        <div className="relative bg-gray-800 p-2 md:p-4 rounded-xl shadow-lg ring-1 ring-white/10 flex flex-col items-center justify-center space-y-2 md:space-y-4" data-testid={`dashboard-table-${tableId}`}>
            <h1 className="absolute top-2 left-2 text-xs md:text-sm font-bold text-gray-500">#{tableId}</h1>
            <div className="w-full flex flex-col items-center space-y-2">
                <div className="w-full flex flex-col sm:flex-row justify-around items-center sm:space-y-4 sm:space-x-2 md:space-x-4">
                    {match && (<>
                        {match.raceTo != match.scoreA && match.raceTo != match.scoreB && (<>
                            <Player playerId="1" photo={match.playerA.image} playerName={match.playerA.name} legsWon={match.scoreA} score={playerAScore} lastThrows={currentLastThrows?.filter(t => t.playerId == playerAId)?.map(t => t.score)} average={playerAAvgDisplay} active={nextP == playerAId} startedLeg={startingPlayerId == playerAId} />

                            <div className="text-center flex-none my-2 sm:my-0">
                                <h2 className="text-lg md:text-2xl font-bold text-sky-400">VS</h2>
                            </div>

                            <Player playerId="2" photo={match.playerB.image} playerName={match.playerB.name} legsWon={match.scoreB} score={playerBScore} lastThrows={currentLastThrows?.filter(t => t.playerId == playerBId)?.map(t => t.score)} average={playerBAvgDisplay} active={nextP == playerBId} startedLeg={startingPlayerId == playerBId} />
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

function Player({ playerId, playerName, photo, active, legsWon, score, lastThrows, average, startedLeg }: {
    photo: string, playerId: string, playerName: string, active?: boolean, score: any, legsWon?: number, lastThrows?: any[], average?: string, startedLeg?: boolean

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
            <h2
                aria-label={startedLeg ? `${playerName} started this leg` : playerName}
                className="px-1 text-center text-sm font-bold text-white md:text-xl"
                title={startedLeg ? `${playerName} started this leg` : playerName}
            >
                <span className="truncate">{playerName}</span>
            </h2>
            <div className="text-center">
                <p
                    aria-label={startedLeg ? `${playerName} started this leg. Legs: ${legsWon}` : undefined}
                    className="flex items-center justify-center gap-1 text-sm md:text-xl text-gray-400"
                    title={startedLeg ? `${playerName} started this leg` : undefined}
                >
                    {startedLeg ? <DartIcon className="h-5 w-5 shrink-0 md:h-6 md:w-6" testId="dashboard-leg-starter-icon" /> : null}
                    <span>Legs: <span className="font-semibold text-white text-md md:text-2xl">{legsWon}</span></span>
                </p>
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