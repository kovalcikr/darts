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
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-1 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">Priemer</th>
                        <th className="px-3 py-2 whitespace-nowrap">Legy</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    <tr className="*:text-gray-900">
                        <td className="px-1 py-2 whitespace-nowrap">{playerA.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{playerA.matchAvg.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{playerA.legCount}</td>
                    </tr>
                    <tr className="*:text-gray-900">
                        <td className="px-1 py-2 whitespace-nowrap">{playerB.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{playerB.matchAvg.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{playerB.legCount}</td>
                    </tr>
                </tbody>
            </table>
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
            {Object.entries(throwsByLeg).map(([leg, legThrows]) => (
                <div key={leg}>
                    <h2 className="text-xl font-bold mt-4">Leg {leg}</h2>
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
                                        <td className="px-1 py-2 whitespace-nowrap">{row.playerA}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{row.playerB}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    )
}

function getLegRows(legThrows, playerAId, playerBId) {
    const rows = [];
    let playerAThrows = legThrows.filter(t => t.playerId === playerAId).map(t => t.score);
    let playerBThrows = legThrows.filter(t => t.playerId === playerBId).map(t => t.score);
    const numRows = Math.max(playerAThrows.length, playerBThrows.length);

    for (let i = 0; i < numRows; i++) {
        rows.push({
            playerA: playerAThrows[i] || '',
            playerB: playerBThrows[i] || '',
        });
    }
    return rows;
}
