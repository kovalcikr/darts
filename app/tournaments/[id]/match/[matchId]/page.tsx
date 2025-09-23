import { getFullMatch } from "@/app/lib/match";
import Link from "next/link";

export default async function MatchPage({ params }: { params: { id: string, matchId: string } }) {
    const fullMatch = await getFullMatch(params.matchId, false);

    if (!fullMatch) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-white text-black">
                <h1 className="text-2xl font-bold">Zápas nenájdený...</h1>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen text-gray-900 bg-white">
            <header className="sticky top-0 z-40 w-full backdrop-blur flex-none">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="relative flex items-center">
                            <div className="font-bold text-xl">
                                {fullMatch.playerA.name} vs {fullMatch.playerB.name}
                            </div>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-slate-700">
                                    <ul className="flex space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-500" href={`/stats/tournaments/${params.id}`}>Späť na turnaj</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-auto">
                <div className="max-w-7xl mx-auto py-4 px-4">
                    <PlayerStats playerA={fullMatch.playerA} playerB={fullMatch.playerB} />
                    <ThrowsList throws={fullMatch.throws} playerA={fullMatch.playerA} playerB={fullMatch.playerB} />
                </div>
            </main>
        </div>
    )
}

function PlayerStats({ playerA, playerB }) {
    return (
        <div className="flex justify-around">
            <div className="w-1/2 p-4">
                <div className="flex items-center">
                    <img src={playerA.imageUrl} className="w-12 h-12 rounded-full" alt={playerA.name} />
                    <h2 className="text-2xl font-bold ml-4">{playerA.name}</h2>
                </div>
                <div className="mt-4">
                    <p><strong>Priemer:</strong> {playerA.matchAvg.toFixed(2)}</p>
                    <p><strong>Legy:</strong> {playerA.legCount}</p>
                    <p><strong>Najvyšší náhod:</strong> {playerA.highestScore}</p>
                    <p><strong>Najlepší checkout:</strong> {playerA.bestCheckout}</p>
                    <p><strong>Najlepší leg:</strong> {playerA.bestLeg}</p>
                </div>
            </div>
            <div className="w-1/2 p-4">
                <div className="flex items-center">
                    <img src={playerB.imageUrl} className="w-12 h-12 rounded-full" alt={playerB.name} />
                    <h2 className="text-2xl font-bold ml-4">{playerB.name}</h2>
                </div>
                <div className="mt-4">
                    <p><strong>Priemer:</strong> {playerB.matchAvg.toFixed(2)}</p>
                    <p><strong>Legy:</strong> {playerB.legCount}</p>
                    <p><strong>Najvyšší náhod:</strong> {playerB.highestScore}</p>
                    <p><strong>Najlepší checkout:</strong> {playerB.bestCheckout}</p>
                    <p><strong>Najlepší leg:</strong> {playerB.bestLeg}</p>
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
        <div className="mt-8">
            {Object.entries(throwsByLeg).map(([leg, legThrows]: [string, any[]]) => {
                const legWinner = legThrows.find(t => t.checkout)?.playerId;
                return (
                    <div key={leg}>
                        <h2 className={`text-xl font-bold mt-4 ${legWinner === playerA.id ? 'text-blue-700' : legWinner === playerB.id ? 'text-red-700' : ''}`}>
                            Leg {leg}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y-2 divide-gray-200">
                                <thead className="text-left ltr:text-left rtl:text-right">
                                    <tr className="*:font-medium *:text-gray-900">
                                        <th className="px-1 py-2 whitespace-nowrap">{playerA.name}</th>
                                        <th className="px-3 py-2 whitespace-nowrap">{playerB.name}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                                    {getLegRows(legThrows, playerA.id, playerB.id).map((row, i) => (
                                        <tr key={i} className="*:text-gray-900">
                                            <td className={`px-1 py-2 whitespace-nowrap ${row.playerA?.first ? 'font-bold' : ''} ${row.playerA?.checkout ? 'text-green-600' : ''}`}>
                                                {row.playerA?.score}
                                            </td>
                                            <td className={`px-3 py-2 whitespace-nowrap ${row.playerB?.first ? 'font-bold' : ''} ${row.playerB?.checkout ? 'text-green-600' : ''}`}>
                                                {row.playerB?.score}
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

    for (let i = 0; i < numRows; i++) {
        const row = { playerA: null, playerB: null };
        if (playerAThrows[i]) {
            row.playerA = {
                score: playerAThrows[i].score,
                checkout: playerAThrows[i].checkout,
                first: i === 0,
            };
        }
        if (playerBThrows[i]) {
            row.playerB = {
                score: playerBThrows[i].score,
                checkout: playerBThrows[i].checkout,
                first: i === 0,
            };
        }
        rows.push(row);
    }
    return rows;
}
