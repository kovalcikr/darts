import getTournamentInfo, { getResults } from "@/app/lib/cuescore";
import prisma from "@/app/lib/db";
import { getPlayers } from "@/app/lib/players";
import { getCachedTournaments } from "@/app/lib/tournament";
import { randomUUID } from "crypto";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

export async function generateStaticParams() {
    return (await getCachedTournaments()).map((t) => ({
        id: t.id,
    }))
}

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

    const bLegPlayers = bestLeg.filter(l => l._sum.darts == bestLeg[0]._sum.darts).reduce((a, v) => {
        if (!a[v.playerId]) {
            a[v.playerId] = 1;
        } else {
            a[v.playerId] = a[v.playerId] + 1
        }
        return a;
    }, {});

    const bLeg = Object.values(legMap).sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    const bestLegDarts = bestLeg[0]?._sum?.darts || 0
    return { bLeg, bestLegDarts, bLegPlayers };
});

const cachedMatchAverages = unstable_cache(async (tournamentId, avg) => {
    console.log("Fetching match averages from DB");
    return await getMatchAverages(tournamentId, avg);
});

export default async function TournamentStats({ params }: { params: { id: string } }) {

    const tournament = await cachedTournament(params.id);

    if (!tournament) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-white text-black">
                <h1 className="text-2xl font-bold">Turnaj nenájdený...  </h1>
            </div>
        )
    }

    const results = await cachedResults(params.id);

    const players = await cachedPlayers(params.id);

    const highScore = await cachedHighScore(params.id);

    const { bestCheckout, bestCoc } = await cachedBestCheckout(params.id);

    const { bLeg, bestLegDarts, bLegPlayers } = await cachedBestLeg(params.id);

    function avg(match) {
        return (match._sum.score || 0) / match._sum.darts * 3;
    }

    const { bestAvg, avgPP } = await cachedMatchAverages(params.id, avg);

    function Stat({ name, value }) {
        return (<div className="my-1"><span className="font-bold">{name}: </span>{value}</div>)
    }

    function StatNames({ name, playerIds }) {
        return (
            <div className="flex flex-row my-1">
                <div className="font-bold">{name}: </div>
                {playerIds.map(pid =>
                (
                    <div className="rounded border border-slate-600 px-2 mx-1 bg-slate-200" key={randomUUID()}>{pid}</div>
                ))}
            </div>
        )
    }

    function StatWithNames({ name, value, playerIds }) {
        return (
            <div className="flex flex-row my-1">
                <div className="font-bold">{name}: </div><div className="mx-1">{value}</div>
                {playerIds.map(pid =>
                (
                    <div className="rounded border border-slate-600 px-2 mx-1 bg-slate-200" key={randomUUID()}>{pid}</div>
                ))}
            </div>
        )
    }


    return (

        <div className="w-full min-h-screen text-gray-900 bg-white">
            <header className="sticky top-0 z-40 w-full backdrop-blur flex-none">
                <div className="max-w-7xl mx-auto">
                    <div className="py-4 px-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="relative flex items-center">
                            <div className="font-bold text-xl">Relax darts cup: štatistiky turnaja {tournament.name}</div>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-slate-700">
                                    <ul className="flex space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-500" href="/">Domov</Link>
                                        </li>
                                        <li>
                                            <Link className="hover:text-sky-500" href="/stats/tournaments">Späť</Link>
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
                    <div className="text-gray-700 text-base">
                        {!results.tournamentId && (
                            <div>
                                <div className="flex">
                                    <Image src="/icons8-gold-medal-40.png" alt="gold medal icons" width={40} height={40} />
                                    <span className="text-2xl">{results[1][0].name}</span>
                                </div>
                                <div className="flex">
                                    <Image src="/icons8-silver-medal-40.png" alt="gold medal icons" width={40} height={40} />
                                    <span className="text-2xl">{results[2][0].name}</span>
                                </div>
                                <div className="flex">
                                    <Image src="/icons8-bronze-medal-40.png" alt="gold medal icons" width={40} height={40} />
                                    <span className="text-2xl">{results[3][0].name} a {results[3][1].name}</span>
                                </div>
                            </div>
                        )}
                        <Stat name={"Počet hráčov"} value={Object.keys(players).length} />
                        <StatNames name={180} playerIds={highScore.filter(s => s.s180 > 0).map(p => players[p.player])} />
                        <StatNames name="170+" playerIds={highScore.filter(s => s.s170 > 0).map(p => players[p.player])} />
                        { bestCheckout[0] && <StatWithNames name="Najlepší checkout" value={bestCheckout[0].score} playerIds={[players[bestCheckout[0].playerId]]} /> }
                        <StatWithNames name="Najlepší priemer v zápase" value={avg(bestAvg[0]).toFixed(2)} playerIds={[players[bestAvg[0].playerId]]} />
                        { bestLegDarts && <StatWithNames name="Najlepší leg" value={bestLegDarts} playerIds={Object.entries(bLegPlayers).map(([k, v]) => players[k] + (v == 1 ? "" : " (" + v + "x)"))} /> }

                        <BestCheckoutTable bestCoc={bestCoc} players={players} />

                        <HighScoreTable highScores={highScore} players={players} />

                        <BestLegTable bestLeg={bLeg} players={players} />

                        <AveragesTable avgPP={avgPP} players={players} />
                    </div>
                </div>
            </main>
        </div>
    )
}

async function getMatchAverages(id: string, avg: (match: any) => number) {
    const matchSums = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "playerId"],
        where: {
            tournamentId: id
        },
        _sum: {
            score: true,
            darts: true
        }
    });
    const bestAvg = matchSums.sort((a, b) => avg(a) - avg(b)).reverse();
    const avgPerPlayer = {};
    bestAvg.forEach(match => {
        const player = avgPerPlayer[match.playerId];
        const average = avg(match);
        if (!player) {
            avgPerPlayer[match.playerId] = {
                player: match.playerId,
                max: average,
                u40: average < 40 ? 1 : 0,
                o40: average >= 40 && average < 50 ? 1 : 0,
                o50: average >= 50 && average < 55 ? 1 : 0,
                o55: average >= 55 && average < 60 ? 1 : 0,
                o60: average >= 60 && average < 65 ? 1 : 0,
                o65: average >= 65 && average < 75 ? 1 : 0,
                o75: average >= 75 ? 1 : 0
            };
        } else {
            if (player.max < avg(match)) {
                player.max = avg(match);
            }
            player.u40 += average < 40 ? 1 : 0,
                player.o40 += average >= 40 && average < 50 ? 1 : 0,
                player.o50 += average >= 50 && average < 55 ? 1 : 0,
                player.o55 += average >= 55 && average < 60 ? 1 : 0,
                player.o60 += average >= 60 && average < 65 ? 1 : 0,
                player.o65 += average >= 65 && average < 75 ? 1 : 0,
                player.o75 += average >= 75 ? 1 : 0;
        }
    });
    const avgPP = Object.values(avgPerPlayer).sort((a: { max: number }, b: { max: number }) => a.max - b.max);;

    return { bestAvg, avgPP };
}

async function getBestCheckout(id: string) {
    const bestCheckout = await prisma.playerThrow.findMany({
        where: {
            tournamentId: id,
            checkout: true,
            score: {
                gte: 60
            }
        },
        orderBy: {
            score: "desc"
        }
    });
    const bestCo = {};
    bestCheckout.forEach((co, index) => {
        const data = bestCo[co.playerId];
        if (!data) {
            bestCo[co.playerId] = {
                player: co.playerId,
                c60: co.score >= 60 && co.score < 80 ? 1 : 0,
                c80: co.score >= 80 && co.score < 100 ? 1 : 0,
                c100: co.score >= 100 ? 1 : 0,
                scores: [co.score],
                index: index
            };
        } else {
            data.c60 += co.score >= 60 && co.score < 80 ? 1 : 0;
            data.c80 += co.score >= 80 && co.score < 100 ? 1 : 0;
            data.c100 += co.score >= 100 ? 1 : 0,
                data.scores.push(co.score);
        }
    });
    const bestCoc = Object.values(bestCo).sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    return { bestCheckout, bestCoc };
}

async function getHighScore(tournamentId: string): Promise<{ player: string, s80: number, s100: number, s133: number, s170: number, b170: number[], s180: number }[]> {
    const highScore = await prisma.playerThrow.findMany({
        where: {
            AND: [
                {
                    tournamentId: tournamentId
                },
                {
                    score: {
                        gte: 80
                    }
                }
            ]
        },
        orderBy: {
            score: "desc"
        }
    });
    const hs = {};
    highScore.forEach((sc, index) => {
        const data = hs[sc.playerId];
        if (!data) {
            hs[sc.playerId] = {
                player: sc.playerId,
                s80: sc.score >= 80 && sc.score < 95 ? 1 : 0,
                s100: sc.score >= 95 && sc.score < 133 ? 1 : 0,
                s133: sc.score >= 133 && sc.score < 170 ? 1 : 0,
                s170: sc.score >= 170 && sc.score < 180 ? 1 : 0,
                b170: sc.score > 140 && sc.score <= 180 ? [sc.score] : [],
                s180: sc.score == 180 ? 1 : 0,
                index: index
            };
        } else {
            data.s80 += sc.score >= 80 && sc.score < 100 ? 1 : 0,
                data.s100 += sc.score >= 100 && sc.score < 133 ? 1 : 0,
                data.s133 += sc.score >= 133 && sc.score < 170 ? 1 : 0,
                data.s170 += sc.score >= 170 && sc.score < 180 ? 1 : 0,
                data.s180 += sc.score == 180 ? 1 : 0;
            if (sc.score > 140 && sc.score <= 180) {
                data.b170.push(sc.score);
            }
        }
    });
    const hss = Object.values(hs).sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    return hss as { player: string, s80: number, s100: number, s133: number, s170: number, b170: number[], s180: number }[];
}

function Header({ text }) {
    return (
        <span className="flex items-center">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300"></span>

            <span className="text-2xl shrink-0 px-4 text-gray-900">{text}</span>

            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300"></span>
        </span>

    )
}

function BestCheckoutTable({ bestCoc, players }) {
    return (
        <div className="overflow-x-auto">
            <Header text={"Najlepšie zatvorenie"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-1x     py-2 whitespace-nowrap"></th>
                        <th className="px-3 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">60+</th>
                        <th className="px-3 py-2 whitespace-nowrap">80+</th>
                        <th className="px-3 py-2 whitespace-nowrap">100+</th>
                        <th className="px-3 py-2 whitespace-nowrap">Zatvorenia</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        bestCoc.map((co, index) => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-1 py-2 whitespace-nowrap">{index + 1}.</td>
                                <td className="px-3 py-2 whitespace-nowrap">{players[co.player]}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.c60}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.c80}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.c100}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.scores.join(", ")}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

function HighScoreTable({ highScores, players }) {

    return (
        <div className="overflow-x-auto">
            <Header text={"Najvyšší náhod"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-1 py-2 whitespace-nowrap"></th>
                        <th className="px-3 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">80+</th>
                        <th className="px-3 py-2 whitespace-nowrap">95+</th>
                        <th className="px-3 py-2 whitespace-nowrap">133+</th>
                        <th className="px-3 py-2 whitespace-nowrap">170+</th>
                        <th className="px-3 py-2 whitespace-nowrap">180</th>
                        <th className="px-3 py-2 whitespace-nowrap">Hody 141+</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        highScores.map((co, index) => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-1 py-2 whitespace-nowrap">{index + 1}.</td>
                                <td className="px-3 py-2 whitespace-nowrap">{players[co.player]}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s80}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s100}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s133}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s170}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s180}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.b170.join(", ")}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

function BestLegTable({ bestLeg, players }) {
    return (
        <div className="overflow-x-auto">
            <Header text={"Najlepší leg"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-1 py-2 whitespace-nowrap"></th>
                        <th className="px-3 py-2 whitespace-nowrap text-right">Kolo</th>
                        <th className="px-3 py-2 whitespace-nowrap">5</th>
                        <th className="px-3 py-2 whitespace-nowrap">6</th>
                        <th className="px-3 py-2 whitespace-nowrap">7</th>
                        <th className="px-3 py-2 whitespace-nowrap">8</th>
                        <th className="px-3 py-2 whitespace-nowrap">9</th>
                        <th className="px-3 py-2 whitespace-nowrap">Top</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        bestLeg.map((co, index) => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-1 py-2 whitespace-nowrap">{index + 1}.</td>
                                <td className="px-3 py-2 whitespace-nowrap">{players[co.player]}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[5] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[6] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[7] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[8] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[9] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.best}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

function AveragesTable({ avgPP, players }) {
    return (
        <div className="overflow-x-auto">
            <Header text={"Najvyšší priemer v zápase"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-1 py-2 whitespace-nowrap"></th>
                        <th className="px-3 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">40-</th>
                        <th className="px-3 py-2 whitespace-nowrap">40+</th>
                        <th className="px-3 py-2 whitespace-nowrap">50+</th>
                        <th className="px-3 py-2 whitespace-nowrap">55+</th>
                        <th className="px-3 py-2 whitespace-nowrap">60+</th>
                        <th className="px-3 py-2 whitespace-nowrap">65+</th>
                        <th className="px-3 py-2 whitespace-nowrap">75+</th>
                        <th className="px-3 py-2 whitespace-nowrap">Top</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        avgPP.map((co, index) => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-1 py-2 whitespace-nowrap">{index + 1}.</td>
                                <td className="px-3 py-2 whitespace-nowrap">{players[co.player]}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.u40}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.o40}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.o50}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.o55}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.o60}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.o65}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.o75}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.max.toFixed(2)}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}