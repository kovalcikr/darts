import { Header } from "@/app/components/header";
import { getResults } from "@/app/lib/cuescore";
import { findMatchesByTournament } from "@/app/lib/data";
import prisma from "@/app/lib/db";
import { getPlayers } from "@/app/lib/players";
import { randomUUID } from "crypto";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

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

const cachedHighScore = unstable_cache(async (tournamentId) => {
    console.log("Fetching high scores from DB");
    return await getHighScore(tournamentId);
});

const cachedBestCheckout = unstable_cache(async (tournamentId) => {
    console.log("Fetching best checkout from DB");
    return await getBestCheckout(tournamentId);
});

const cachedBestLeg = unstable_cache(async (tournamentId) => {
    console.log("Fetching best leg from DB");
    const bestLeg = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "leg", "playerId"],
        where: {
            tournamentId: tournamentId
        },
        _sum: {
            score: true,
            darts: true
        },
        having: {
            score: {
                _sum: {
                    equals: 501
                }
            },
            darts: {
                _sum: {
                    lte: 27
                }
            }
        },
        orderBy: [
            {
                _sum: {
                    darts: "asc"
                }
            }
        ]
    })
    const legMap = {};
    bestLeg.forEach((leg, index) => {
        const player = legMap[leg.playerId]
        const darts = leg._sum.darts;
        const round = Math.ceil(darts / 3);
        if (!player) {
            legMap[leg.playerId] = {
                player: leg.playerId,
                best: darts,
                [round]: 1,
                index: index
            }
        } else {
            if (player.best >= darts) {
                player.best = darts;
            }
            if (!player[round]) {
                player[round] = 1
            } else {
                player[round]++;
            }
        }
    })

    const bLegPlayers = bestLeg.length > 0 ? bestLeg.filter(l => l._sum.darts == bestLeg[0]._sum.darts).reduce((a, v) => {
        if (!a[v.playerId]) {
            a[v.playerId] = 1;
        } else {
            a[v.playerId] = a[v.playerId] + 1
        }
        return a;
    }, {}) : {};

    const bLeg = Object.values(legMap).sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    const bestLegDarts = bestLeg[0]?._sum?.darts || 0
    return { bLeg, bestLegDarts, bLegPlayers };
});

const cachedMatchAverages = unstable_cache(async (tournamentId, avg) => {
    console.log("Fetching match averages from DB");
    return await getMatchAverages(tournamentId, avg);
});

const cachedMatches = unstable_cache(async (tournamentId) => {
    console.log("Fetching matches from DB");
    return await findMatchesByTournament(tournamentId);
});

export default async function TournamentStats({ params }: { params: { id: string } }) {

    const tournament = await cachedTournament(params.id);

    if (!tournament) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-gray-100">
                <h1 className="text-2xl font-bold">Turnaj nenájdený...  </h1>
            </div>
        )
    }

    const results = await cachedResults(params.id);
    const players = await cachedPlayers(params.id);
    const highScore = await cachedHighScore(params.id);
    const { bestCheckout, bestCoc } = await cachedBestCheckout(params.id);
    const { bLeg, bestLegDarts, bLegPlayers } = await cachedBestLeg(params.id);
    const matches = await cachedMatches(params.id);

    function avg(match) {
        return match._sum.darts ? ((match._sum.score || 0) / match._sum.darts * 3) : 0;
    }
    const { bestAvg, avgPP } = await cachedMatchAverages(params.id, avg);


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
                            <MatchesList matches={matches} tournamentId={params.id} />
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

async function getMatchAverages(id: string, avg: (match: any) => number) {
    const matchSums = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "playerId"],
        where: { tournamentId: id },
        _sum: { score: true, darts: true }
    });
    const bestAvg = matchSums.sort((a, b) => avg(b) - avg(a));
    const avgPerPlayer = {};
    bestAvg.forEach(match => {
        const player = avgPerPlayer[match.playerId];
        const average = avg(match);
        if (!player) {
            avgPerPlayer[match.playerId] = {
                player: match.playerId, max: average, u40: average < 40 ? 1 : 0,
                o40: average >= 40 && average < 50 ? 1 : 0, o50: average >= 50 && average < 55 ? 1 : 0,
                o55: average >= 55 && average < 60 ? 1 : 0, o60: average >= 60 && average < 65 ? 1 : 0,
                o65: average >= 65 && average < 75 ? 1 : 0, o75: average >= 75 ? 1 : 0
            };
        } else {
            if (player.max < average) player.max = average;
            player.u40 += average < 40 ? 1 : 0;
            player.o40 += average >= 40 && average < 50 ? 1 : 0;
            player.o50 += average >= 50 && average < 55 ? 1 : 0;
            player.o55 += average >= 55 && average < 60 ? 1 : 0;
            player.o60 += average >= 60 && average < 65 ? 1 : 0;
            player.o65 += average >= 65 && average < 75 ? 1 : 0;
            player.o75 += average >= 75 ? 1 : 0;
        }
    });
    const avgPP = Object.values(avgPerPlayer).sort((a: { max: number }, b: { max: number }) => b.max - a.max);
    return { bestAvg, avgPP };
}

async function getBestCheckout(id: string) {
    const bestCheckout = await prisma.playerThrow.findMany({
        where: { tournamentId: id, checkout: true, score: { gte: 60 } },
        orderBy: { score: "desc" }
    });
    const bestCo = {};
    bestCheckout.forEach((co, index) => {
        const data = bestCo[co.playerId];
        if (!data) {
            bestCo[co.playerId] = {
                player: co.playerId, c60: co.score >= 60 && co.score < 80 ? 1 : 0,
                c80: co.score >= 80 && co.score < 100 ? 1 : 0, c100: co.score >= 100 ? 1 : 0,
                scores: [co.score], index: index
            };
        } else {
            data.c60 += co.score >= 60 && co.score < 80 ? 1 : 0;
            data.c80 += co.score >= 80 && co.score < 100 ? 1 : 0;
            data.c100 += co.score >= 100 ? 1 : 0;
            data.scores.push(co.score);
        }
    });
    const bestCoc = Object.values(bestCo).sort((a: any, b: any) => (b.c100 - a.c100) || (b.c80 - a.c80) || (b.c60 - a.c60) || a.index - b.index);
    return { bestCheckout, bestCoc };
}

async function getHighScore(tournamentId: string): Promise<{ player: string, s80: number, s100: number, s133: number, s170: number, b170: number[], s180: number }[]> {
    const highScore = await prisma.playerThrow.findMany({
        where: { tournamentId: tournamentId, score: { gte: 80 } },
        orderBy: { score: "desc" }
    });
    const hs = {};
    highScore.forEach((sc, index) => {
        const data = hs[sc.playerId];
        if (!data) {
            hs[sc.playerId] = {
                player: sc.playerId, s80: sc.score >= 80 && sc.score < 95 ? 1 : 0,
                s100: sc.score >= 95 && sc.score < 133 ? 1 : 0, s133: sc.score >= 133 && sc.score < 170 ? 1 : 0,
                s170: sc.score >= 170 && sc.score < 180 ? 1 : 0, b170: sc.score > 140 ? [sc.score] : [],
                s180: sc.score == 180 ? 1 : 0, index: index
            };
        } else {
            data.s80 += sc.score >= 80 && sc.score < 95 ? 1 : 0;
            data.s100 += sc.score >= 95 && sc.score < 133 ? 1 : 0;
            data.s133 += sc.score >= 133 && sc.score < 170 ? 1 : 0;
            data.s170 += sc.score >= 170 && sc.score < 180 ? 1 : 0;
            data.s180 += sc.score == 180 ? 1 : 0;
            if (sc.score > 140) data.b170.push(sc.score);
        }
    });
    const hss = Object.values(hs).sort((a: any, b: any) => (b.s180 - a.s180) || (b.s170 - a.s170) || (b.s133 - a.s133) || (b.s100 - a.s100) || (b.s80 - a.s80) || a.index - b.index);
    return hss as any;
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