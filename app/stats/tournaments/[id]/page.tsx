import getTournamentInfo, { getResults } from "@/app/lib/cuescore";
import prisma from "@/app/lib/db";
import { getPlayers } from "@/app/lib/players";
import { randomUUID } from "crypto";
import Image from "next/image";
import Link from "next/link";

export async function generateStaticParams() {
    const tournaments = await prisma.tournament.findMany({
        where: {
            name: {
                contains: "2025"
            }
        }
    });


    return tournaments.map((t) => ({
        id: t.id,
    }))
}

export default async function TournamentStats({ params }: { params: { id: string } }) {

    const tournament = await prisma.tournament.findUnique({
        where: {
            id: params.id
        }
    });

    const results = await getResults(params.id)

    const players = await getPlayers([params.id])
    const highScore = await getHighScore(params, players);
    const { bestCheckout, bestCoc } = await getBestCheckout(params, players);

    const bestLeg = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "leg", "playerId"],
        where: {
            tournamentId: params.id
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
                    lte: 21
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
    const legMap = new Map();
    bestLeg.forEach(leg => {
        const player = legMap.get(leg.playerId)
        const darts = leg._sum.darts;
        if (!player) {
            legMap.set(leg.playerId, {
                player: players.get(leg.playerId),
                [darts]: 1
            })
        } else {
            if (!player[darts]) {
                player[darts] = 1
            } else {
                player[darts]++;
            }
        }
    })
    const bLeg = Array.from(legMap).map(v => v[1])

    const bLegPlayers = Array.from(bestLeg.filter(l => l._sum.darts == bestLeg[0]._sum.darts).reduce(((a, v) => {
        if (!a.get(v.playerId)) {
            a.set(v.playerId, 1)
        } else (a.set(v.playerId, a.get(v.playerId) + 1))
        return a;
    }), new Map())).map(l => players.get(l[0]) + " (" + l[1] + "x)")

    function avg(match) {
        return (match._sum.score || 0) / match._sum.darts * 3;
    }

    const { bestAvg, avgPP } = await getMatchAverages(params, avg, players);

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
                            <div className="font-bold text-xl">Relax darts cup: štatistiky turnaja { tournament.name }</div>
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
                        <div>
                            <div className="flex">
                                <Image src="/icons8-gold-medal-40.png" alt="gold medal icons" width={40} height={40} />
                                <span className="text-2xl">{ results[1][0].name }</span>
                            </div>
                            <div className="flex">
                                <Image src="/icons8-silver-medal-40.png" alt="gold medal icons" width={40} height={40} />
                                <span className="text-2xl">{ results[2][0].name }</span>
                            </div>
                            <div className="flex">
                                <Image src="/icons8-bronze-medal-40.png" alt="gold medal icons" width={40} height={40} />
                                <span className="text-2xl">{ results[3][0].name } a { results[3][1].name }</span>
                            </div>
                        </div>
                        <Stat name={"Počet hráčov"} value={players.size} />
                        <StatNames name={180} playerIds={highScore.filter(s => s.s180 > 0).map(p => p.player)} />
                        <StatNames name="170+" playerIds={highScore.filter(s => s.s170 > 0).map(p => p.player)} />
                        <StatWithNames name="Najlepší checkout" value={bestCheckout[0].score} playerIds={[players.get(bestCheckout[0].playerId)]} />
                        <StatWithNames name="Najlepší priemer v zápase" value={avg(bestAvg[0]).toFixed(2)} playerIds={[players.get(bestAvg[0].playerId)]} />
                        <StatWithNames name="Najlepší leg" value={bestLeg[0]._sum.darts} playerIds={bLegPlayers} />

                        <BestCheckoutTable bestCoc={bestCoc} />

                        <HighScoreTable highScores={highScore} />

                        <BestLegTable bestLeg={bLeg} />

                        <AveragesTable avgPP={avgPP} />
                    </div>
                </div>
            </main>
        </div>
    )
}

async function getMatchAverages(params: { id: string; }, avg: (match: any) => number, players: Map<string, string>) {
    const matchSums = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "playerId"],
        where: {
            tournamentId: params.id
        },
        _sum: {
            score: true,
            darts: true
        }
    });
    const bestAvg = matchSums.sort((a, b) => avg(a) - avg(b)).reverse();
    const avgPerPlayer = new Map();
    bestAvg.forEach(match => {
        const player = avgPerPlayer.get(match.playerId);
        const average = avg(match);
        if (!player) {
            avgPerPlayer.set(match.playerId, {
                player: players.get(match.playerId),
                max: average,
                u40: average < 40 ? 1 : 0,
                o40: average >= 40 && average < 50 ? 1 : 0,
                o50: average >= 50 && average < 55 ? 1 : 0,
                o55: average >= 55 && average < 60 ? 1 : 0,
                o60: average >= 60 && average < 65 ? 1 : 0,
                o65: average >= 65 && average < 75 ? 1 : 0,
                o75: average >= 75 ? 1 : 0
            });
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
    const avgPP = Array.from(avgPerPlayer).map(a => a[1]);

    return { bestAvg, avgPP };
}

async function getBestCheckout(params: { id: string; }, players: Map<string, string>) {
    const bestCheckout = await prisma.playerThrow.findMany({
        where: {
            tournamentId: params.id,
            checkout: true,
            score: {
                gte: 60
            }
        },
        orderBy: {
            score: "desc"
        }
    });
    const bestCo = new Map();
    bestCheckout.forEach(co => {
        const data = bestCo.get(co.playerId);
        if (!data) {
            bestCo.set(co.playerId, {
                player: players.get(co.playerId),
                c60: co.score >= 60 && co.score < 80 ? 1 : 0,
                c80: co.score >= 80 && co.score < 100 ? 1 : 0,
                c100: co.score >= 100 ? 1 : 0,
                scores: [co.score]
            });
        } else {
            data.c60 += co.score >= 60 && co.score < 80 ? 1 : 0;
            data.c80 += co.score >= 80 && co.score < 100 ? 1 : 0;
            data.c100 += co.score >= 100 ? 1 : 0,
                data.scores.push(co.score);
        }
    });
    const bestCoc = Array.from(bestCo).map(co => co[1]);
    return { bestCheckout, bestCoc };
}

async function getHighScore(params: { id: string; }, players: Map<string, string>) {
    const highScore = await prisma.playerThrow.findMany({
        where: {
            AND: [
                {
                    tournamentId: params.id
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
    const hs = new Map();
    highScore.forEach(sc => {
        const data = hs.get(sc.playerId);
        if (!data) {
            hs.set(sc.playerId, {
                player: players.get(sc.playerId),
                s80: sc.score >= 80 && sc.score < 100 ? 1 : 0,
                s100: sc.score >= 100 && sc.score < 133 ? 1 : 0,
                s133: sc.score >= 133 && sc.score < 170 ? 1 : 0,
                s170: sc.score >= 170 && sc.score < 180 ? 1 : 0,
                s180: sc.score == 180 ? 1 : 0
            });
        } else {
            data.s80 += sc.score >= 80 && sc.score < 100 ? 1 : 0,
                data.s100 += sc.score >= 100 && sc.score < 133 ? 1 : 0,
                data.s133 += sc.score >= 133 && sc.score < 170 ? 1 : 0,
                data.s170 += sc.score >= 170 && sc.score < 180 ? 1 : 0,
                data.s180 += sc.score == 180 ? 1 : 0;
        }
    });
    const hss = Array.from(hs).map(hs => hs[1]);
    return hss;
}

function Header({ text }) {
    return (
        <span className="flex items-center">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300"></span>

            <span className="shrink-0 px-4 text-gray-900">{text}</span>

            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300"></span>
        </span>

    )
}

function BestCheckoutTable({ bestCoc }) {
    return (
        <div className="overflow-x-auto">
            <Header text={"Najlepšie zatvorenie"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-3 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">60+</th>
                        <th className="px-3 py-2 whitespace-nowrap">80+</th>
                        <th className="px-3 py-2 whitespace-nowrap">100+</th>
                        <th className="px-3 py-2 whitespace-nowrap">Zatvorenia</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        bestCoc.map(co => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-3 py-2 whitespace-nowrap">{co.player}</td>
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

function HighScoreTable({ highScores }) {

    return (
        <div className="overflow-x-auto">
            <Header text={"Najvyšší náhod"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-3 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">80+</th>
                        <th className="px-3 py-2 whitespace-nowrap">100+</th>
                        <th className="px-3 py-2 whitespace-nowrap">133+</th>
                        <th className="px-3 py-2 whitespace-nowrap">170+</th>
                        <th className="px-3 py-2 whitespace-nowrap">180</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        highScores.map(co => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-3 py-2 whitespace-nowrap">{co.player}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s80}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s100}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s133}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s170}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co.s180}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

function BestLegTable({ bestLeg }) {
    return (
        <div className="overflow-x-auto">
            <Header text={"Najlepší leg"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-3 py-2 whitespace-nowrap text-right">Kolo</th>
                        <th colSpan={3} className="px-3 py-2 whitespace-nowrap">5</th>
                        <th colSpan={3} className="px-3 py-2 whitespace-nowrap">6</th>
                        <th colSpan={3} className="px-3 py-2 whitespace-nowrap">7</th>
                    </tr>
                    <tr className="text-left *:font-medium *:text-gray-900">
                        <th className="px-3 py-2 whitespace-nowrap text-right">Sipka</th>
                        <th className="px-3 py-2 whitespace-nowrap">13</th>
                        <th className="px-3 py-2 whitespace-nowrap">14</th>
                        <th className="px-3 py-2 whitespace-nowrap">15</th>
                        <th className="px-3 py-2 whitespace-nowrap">16</th>
                        <th className="px-3 py-2 whitespace-nowrap">17</th>
                        <th className="px-3 py-2 whitespace-nowrap">18</th>
                        <th className="px-3 py-2 whitespace-nowrap">19</th>
                        <th className="px-3 py-2 whitespace-nowrap">20</th>
                        <th className="px-3 py-2 whitespace-nowrap">21</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        bestLeg.map(co => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-3 py-2 whitespace-nowrap">{co.player}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[13] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[14] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[15] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[16] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[17] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[18] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[19] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[20] || 0}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{co[21] || 0}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

function AveragesTable({ avgPP }) {
    return (
        <div className="overflow-x-auto">
            <Header text={"Najvyšší priemer v zápase"} />

            <table className="min-w-full divide-y-2 divide-gray-200">
                <thead className="text-left ltr:text-left rtl:text-right">
                    <tr className="*:font-medium *:text-gray-900">
                        <th className="px-3 py-2 whitespace-nowrap">Meno</th>
                        <th className="px-3 py-2 whitespace-nowrap">40-</th>
                        <th className="px-3 py-2 whitespace-nowrap">40+</th>
                        <th className="px-3 py-2 whitespace-nowrap">55+</th>
                        <th className="px-3 py-2 whitespace-nowrap">60+</th>
                        <th className="px-3 py-2 whitespace-nowrap">65+</th>
                        <th className="px-3 py-2 whitespace-nowrap">75+</th>
                        <th className="px-3 py-2 whitespace-nowrap">Top</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 *:even:bg-gray-50">
                    {
                        avgPP.map(co => (
                            <tr key={co.player} className="*:text-gray-900 *:first:font-medium">
                                <td className="px-3 py-2 whitespace-nowrap">{co.player}</td>
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