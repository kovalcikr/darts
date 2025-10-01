import { getFullMatch } from "@/app/lib/match";
import Link from "next/link";

export default async function MatchPage({ params }: { params: { id: string, matchId: string } }) {
    const fullMatch = await getFullMatch(params.matchId, false);

    if (!fullMatch) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-gray-100">
                <h1 className="text-2xl font-bold">Zápas nenájdený...</h1>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
            <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">
                                {fullMatch.playerA.name} <span className="text-sky-400">vs</span> {fullMatch.playerB.name}
                            </h1>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-gray-400">
                                    <ul className="flex space-x-4 md:space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-400 transition-colors" href={`/stats/tournaments/${params.id}`}>Späť na turnaj</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-auto">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <PlayerStats playerA={fullMatch.playerA} playerB={fullMatch.playerB} />
                    <ThrowsList throws={fullMatch.throws} playerA={fullMatch.playerA} playerB={fullMatch.playerB} />
                </div>
            </main>
        </div>
    )
}

function PlayerStats({ playerA, playerB }) {
    const Stat = ({ label, value }) => (
        <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="font-medium text-gray-400">{label}</span>
            <span className="font-semibold text-white">{value || '-'}</span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 ring-1 ring-white/10">
                <div className="flex items-center">
                    <img src={playerA.imageUrl} width={48} height={48} className="w-12 h-12 rounded-full" alt={playerA.name} />
                    <h2 className="text-2xl font-bold ml-4 text-white">{playerA.name}</h2>
                    <span className="text-2xl font-bold ml-auto text-sky-400">{playerA.legCount}</span>
                </div>
                <div className="mt-6 space-y-2">
                    <Stat label="Priemer" value={playerA.matchAvg.toFixed(2)} />
                    <Stat label="Najvyšší náhod" value={playerA.highestScore} />
                    <Stat label="Najlepší checkout" value={playerA.bestCheckout} />
                    <Stat label="Najlepší leg" value={playerA.bestLeg} />
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 ring-1 ring-white/10">
                <div className="flex items-center">
                    <img src={playerB.imageUrl} width={48} height={48} className="w-12 h-12 rounded-full" alt={playerB.name} />
                    <h2 className="text-2xl font-bold ml-4 text-white">{playerB.name}</h2>
                    <span className="text-2xl font-bold ml-auto text-sky-400">{playerB.legCount}</span>
                </div>
                <div className="mt-6 space-y-2">
                    <Stat label="Priemer" value={playerB.matchAvg.toFixed(2)} />
                    <Stat label="Najvyšší náhod" value={playerB.highestScore} />
                    <Stat label="Najlepší checkout" value={playerB.bestCheckout} />
                    <Stat label="Najlepší leg" value={playerB.bestLeg} />
                </div>
            </div>
        </div>
    )
}

function ThrowsList({ throws, playerA, playerB }) {
    const throwsByLeg = throws.reduce((acc, T) => {
        if (!acc[T.leg]) {
            acc[T.leg] = [];
        }
        acc[T.leg].push(T);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            {Object.entries(throwsByLeg).map(([leg, legThrows]: [string, any[]]) => {
                const legWinner = legThrows.find(t => t.checkout)?.playerId;
                const winnerBgClass = legWinner === playerA.id ? 'bg-blue-900/50' : legWinner === playerB.id ? 'bg-red-900/50' : 'bg-gray-800';
                return (
                    <div key={leg} className={`${winnerBgClass} rounded-xl shadow-lg overflow-hidden ring-1 ring-white/10`}>
                        <h2 className="text-xl font-bold p-4 text-white border-b border-gray-700">
                            Leg {leg}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="text-left">
                                    <tr className="*:font-semibold *:text-gray-300 *:p-4">
                                        <th>{playerA.name}</th>
                                        <th>{playerB.name}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {getLegRows(legThrows, playerA.id, playerB.id).map((row, i) => (
                                        <tr key={i} className="*:py-2 *:px-4 hover:bg-gray-700/50 transition-colors">
                                            <td className={`${row.playerA?.last ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                                {row.playerA && <span className="flex justify-between items-center">{row.playerA.remaining} <span className="text-gray-500 text-sm">({row.playerA.score})</span></span>}
                                            </td>
                                            <td className={`${row.playerB?.last ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                                {row.playerB && <span className="flex justify-between items-center">{row.playerB.remaining} <span className="text-gray-500 text-sm">({row.playerB.score})</span></span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function getLegRows(legThrows, playerAId, playerBId) {
    const rows = [];
    const playerAThrows = legThrows.filter(t => t.playerId === playerAId);
    const playerBThrows = legThrows.filter(t => t.playerId === playerBId);
    const numRows = Math.max(playerAThrows.length, playerBThrows.length);

    let remainingA = 501;
    let remainingB = 501;

    for (let i = 0; i < numRows; i++) {
        const row = { playerA: null, playerB: null };
        if (playerAThrows[i]) {
            const score = playerAThrows[i].score;
            const remainingBefore = remainingA;
            remainingA -= score;
            row.playerA = {
                score: playerAThrows[i].checkout ? `${score} D` : score,
                remaining: remainingBefore,
                last: playerAThrows[i].checkout,
            };
        }
        if (playerBThrows[i]) {
            const score = playerBThrows[i].score;
            const remainingBefore = remainingB;
            remainingB -= score;
            row.playerB = {
                score: playerBThrows[i].checkout ? `${score} D` : score,
                remaining: remainingBefore,
                last: playerBThrows[i].checkout,
            };
        }
        rows.push(row);
    }
    return rows;
}