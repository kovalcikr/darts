import { Header } from "@/app/components/header";
import { getResults } from "@/app/lib/cuescore";
import { getPlayers } from "@/app/lib/players";
import { getCachedTournamentStats } from "@/app/lib/tournament-stats";
import { randomUUID } from "crypto";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import type { RouteParams } from "@/app/lib/next-types";

const cachedTournament = unstable_cache(async (tournamentId) => {
    console.log("Fetching tournament data from DB");
    return await prisma.tournament.findUnique({
        where: {
            id: tournamentId
        }
    });
});

const cachedResults = unstable_cache(async (tournmentId) => {
    console.log("Fetching tournament results from DB");
    return await getResults(tournmentId);
});

const cachedPlayers = unstable_cache(async (tournamentId) => {
    console.log("Fetching players data from DB ");
    return await getPlayers([tournamentId]);
})

export default async function TournamentStats({ params }: { params: RouteParams<{ id: string }> }) {
    const { id } = await params;

    const tournament = await cachedTournament(id);

    if (!tournament) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-gray-100">
                <h1 className="text-2xl font-bold">Turnaj nenájdený...  </h1>
            </div>
        )
    }

    const results = await cachedResults(id);
    const players = await cachedPlayers(id);
    const { matches, highScore, bestCheckout, bestCoc, bLeg, bestLegDarts, bLegPlayers, bestAvg, avgPP } = await getCachedTournamentStats(id);

    function avg(match) {
        return match._sum.darts ? ((match._sum.score || 0) / match._sum.darts * 3) : 0;
    }


    function Stat({ name, value }) {
        return (<div className="my-2 p-2 rounded-lg bg-gray-700/50"><span className="font-bold text-gray-400">{name}: </span><span className="font-semibold text-white">{value}</span></div>)
    }

    function StatNames({ name, playerIds }) {
        if (playerIds.length === 0) return null;
        return (
            <div className="my-2">
                <div className="font-bold text-gray-400 mr-2 mb-2">{name}: </div>
                <div className="flex flex-row flex-wrap items-center">
                    {playerIds.map(pid =>
                    (
                        <div className="rounded-full bg-gray-600 px-3 py-1 text-sm font-semibold text-gray-200 mr-2 mb-2" key={randomUUID()}>{pid}</div>
                    ))}
                </div>
            </div>
        )
    }

    function StatWithNames({ name, value, playerIds }) {
        return (
            <div className="my-2 p-2 rounded-lg bg-gray-700/50">
                <div className="font-bold text-gray-400">{name}: <span className="font-semibold text-white">{value}</span></div>
                <div className="flex flex-row flex-wrap items-center mt-1">
                    {playerIds.map(pid =>
                    (
                        <div className="rounded-full bg-gray-600 px-3 py-1 text-sm font-semibold text-gray-200 mr-2 mb-2" key={randomUUID()}>{pid}</div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-gray-900 text-gray-300">
            <header className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/70 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4">
                        <div className="relative flex items-center">
                            <h1 className="font-bold text-xl text-white">Relax darts cup: <span className="text-sky-400">{tournament.name}</span></h1>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-gray-400">
                                    <ul className="flex space-x-4 md:space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-400 transition-colors" href="/">Domov</Link>
                                        </li>
                                        <li>
                                            <Link className="hover:text-sky-400 transition-colors" href="/stats/tournaments">Späť</Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-auto">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Prehľad</h2>
                            {!results.tournamentId && (
                                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex items-center p-4 bg-yellow-900/50 rounded-lg">
                                        <Image src="/icons8-gold-medal-40.png" alt="gold medal" width={32} height={32} />
                                        <span className="text-lg ml-3 font-semibold text-yellow-400">{results[1][0].name}</span>
                                    </div>
                                    <div className="flex items-center p-4 bg-gray-700/50 rounded-lg">
                                        <Image src="/icons8-silver-medal-40.png" alt="silver medal" width={32} height={32} />
                                        <span className="text-lg ml-3 font-semibold text-gray-300">{results[2][0].name}</span>
                                    </div>
                                    <div className="flex items-center p-4 bg-yellow-700/50 rounded-lg">
                                        <Image src="/icons8-bronze-medal-40.png" alt="bronze medal" width={32} height={32} />
                                        <span className="text-lg ml-3 font-semibold text-yellow-500">{results[3][0].name} a {results[3][1].name}</span>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Stat name={"Počet hráčov"} value={Object.keys(players).length} />
                                {bestCheckout[0] && <StatWithNames name="Najlepší checkout" value={bestCheckout[0].score} playerIds={[players[bestCheckout[0].playerId]]} />}
                                {bestAvg[0] && <StatWithNames name="Najlepší priemer" value={avg(bestAvg[0]).toFixed(2)} playerIds={[players[bestAvg[0].playerId]]} />}
                                {bestLegDarts > 0 && <StatWithNames name="Najlepší leg" value={bestLegDarts} playerIds={Object.entries(bLegPlayers).map(([k, v]) => players[k] + (v == 1 ? "" : " (" + v + "x)"))} />}
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StatNames name={"180"} playerIds={highScore.filter(s => s.s180 > 0).map(p => players[p.player])} />
                                <StatNames name="170+" playerIds={highScore.filter(s => s.s170 > 0).map(p => players[p.player])} />
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <BestCheckoutTable bestCoc={bestCoc} players={players} />
                        </div>

                        <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <HighScoreTable highScores={highScore} players={players} />
                        </div>

                        <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <BestLegTable bestLeg={bLeg} players={players} />
                        </div>

                        <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <AveragesTable avgPP={avgPP} players={players} />
                        </div>

                        <div className="lg:col-span-3 bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <MatchesList matches={matches} tournamentId={id} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function MatchesList({ matches, tournamentId }) {
    const roundOrder = {
        "Final": 100,
        "Semi final": 99,
        "Quarter final": 98,
        "Last 16": 97,
        "Last 32": 96,
        "Last 64": 95,
        "Last 128": 94,
    };
    const roundTranslations = {
        "Final": "Finále",
        "Semi final": "Semifinále",
        "Quarter final": "Štvrťfinále",
        "Last 16": "Osemfinále",
        "Last 32": "Šestnásťfinále",
        "Last 64": "1/32-finále",
        "Last 128": "1/64-finále",
    };

    const getRoundValue = (round) => {
        if (roundOrder[round]) {
            return roundOrder[round];
        }
        const match = round.match(/Round\s+(\d+)/);
        if (match) {
            const roundNumber = parseInt(match[1], 10);
            if (!isNaN(roundNumber)) {
                return roundNumber;
            }
        }
        return 0;
    };

    const sortedMatches = [...matches].sort((a, b) => {
        const roundAValue = getRoundValue(a.round);
        const roundBValue = getRoundValue(b.round);
        return roundAValue - roundBValue;
    });

    return (
        <div className="overflow-x-auto">
            <div className="p-6"><Header text={"Zápasy"} /></div>
            <table className="min-w-full divide-y-2 divide-gray-700">
                <thead className="text-left bg-gray-700/50">
                    <tr className="*:font-semibold *:text-gray-300">
                        <th className="px-4 py-3 whitespace-nowrap">Kolo</th>
                        <th className="px-4 py-3 whitespace-nowrap">Hráč A</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">Skóre</th>
                        <th className="px-4 py-3 whitespace-nowrap">Hráč B</th>
                        <th className="px-4 py-3 whitespace-nowrap"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {sortedMatches.map((match) => {
                        const winnerId = match.playerALegs > match.playerBlegs ? match.playerAId : match.playerBId;
                        return (
                            <tr key={match.id} className="*:text-gray-300 hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap font-medium">{roundTranslations[match.round] || match.round}</td>
                                <td className={`px-4 py-3 whitespace-nowrap ${winnerId === match.playerAId ? 'font-bold text-white' : ''}`}>{match.playerAName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-lg">{match.playerALegs} : {match.playerBlegs}</td>
                                <td className={`px-4 py-3 whitespace-nowrap ${winnerId === match.playerBId ? 'font-bold text-white' : ''}`}>{match.playerBName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <Link href={`/tournaments/${tournamentId}/match/${match.id}`} className="text-sky-400 hover:text-sky-300 font-semibold">Detail</Link>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function BestCheckoutTable({ bestCoc, players }) {
    return (
        <div className="overflow-x-auto">
            <div className="p-6"><Header text={"Najlepšie zatvorenie (počet)"} /></div>
            <table className="min-w-full divide-y-2 divide-gray-700">
                <thead className="text-left bg-gray-700/50">
                    <tr className="*:font-semibold *:text-gray-300">
                        <th className="px-4 py-3 whitespace-nowrap text-center">#</th>
                        <th className="px-4 py-3 whitespace-nowrap">Meno</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">60+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">80+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">100+</th>
                        <th className="px-4 py-3 whitespace-nowrap">Zatvorenia</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {bestCoc.map((co, index) => (
                        <tr key={co.player} className="*:text-gray-300 hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-center font-medium">{index + 1}.</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{players[co.player]}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.c60}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.c80}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.c100}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{co.scores.join(", ")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function HighScoreTable({ highScores, players }) {
    return (
        <div className="overflow-x-auto">
            <div className="p-6"><Header text={"Najvyšší náhod"} /></div>
            <table className="min-w-full divide-y-2 divide-gray-700">
                <thead className="text-left bg-gray-700/50">
                    <tr className="*:font-semibold *:text-gray-300">
                        <th className="px-4 py-3 whitespace-nowrap text-center">#</th>
                        <th className="px-4 py-3 whitespace-nowrap">Meno</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">80+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">95+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">133+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">170+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">180</th>
                        <th className="px-4 py-3 whitespace-nowrap">Top hody</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {highScores.map((co, index) => (
                        <tr key={co.player} className="*:text-gray-300 hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-center font-medium">{index + 1}.</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{players[co.player]}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.s80}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.s100}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.s133}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.s170}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.s180}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{co.b170.join(", ")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function BestLegTable({ bestLeg, players }) {
    return (
        <div className="overflow-x-auto">
            <div className="p-6"><Header text={"Najlepší leg"} /></div>
            <table className="min-w-full divide-y-2 divide-gray-700">
                <thead className="text-left bg-gray-700/50">
                    <tr className="*:font-semibold *:text-gray-300">
                        <th className="px-4 py-3 whitespace-nowrap text-center">#</th>
                        <th className="px-4 py-3 whitespace-nowrap">Meno</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">5. kolo</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">6. kolo</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">7. kolo</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">8. kolo</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">9. kolo</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">Top leg</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {bestLeg.map((co, index) => (
                        <tr key={co.player} className="*:text-gray-300 hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-center font-medium">{index + 1}.</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{players[co.player]}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co[5] || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co[6] || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co[7] || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co[8] || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co[9] || 0}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-white">{co.best}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function AveragesTable({ avgPP, players }) {
    return (
        <div className="overflow-x-auto">
            <div className="p-6"><Header text={"Priemery v zápasoch"} /></div>
            <table className="min-w-full divide-y-2 divide-gray-700">
                <thead className="text-left bg-gray-700/50">
                    <tr className="*:font-semibold *:text-gray-300">
                        <th className="px-4 py-3 whitespace-nowrap text-center">#</th>
                        <th className="px-4 py-3 whitespace-nowrap">Meno</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">40-</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">40+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">50+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">55+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">60+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">65+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">75+</th>
                        <th className="px-4 py-3 whitespace-nowrap text-center">Top priemer</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {avgPP.map((co, index) => (
                        <tr key={co.player} className="*:text-gray-300 hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-center font-medium">{index + 1}.</td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{players[co.player]}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.u40}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.o40}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.o50}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.o55}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.o60}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.o65}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono">{co.o75}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-white">{co.max.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
