import prisma from "@/app/lib/db"
import { getPlayers } from "@/app/lib/players"
import { getTournaments } from "@/app/lib/tournament"
import { randomUUID } from "crypto"
import Link from "next/link"

export async function generateStaticParams() {
    const tournamentIds = await getTournaments()
    const players = await getPlayers(tournamentIds)

    return Array.from(players).map((player) => ({
        id: player[0],
    }))
}

export default async function Player({ params }: { params: { id: string } }) {

    const tournamentIds = await getTournaments()
    const players = await getPlayers(tournamentIds)

    const matches = await prisma.match.findMany({
        where: {
            AND: [
                {
                    tournamentId: {
                        in: tournamentIds
                    },
                },
                {
                    OR: [
                        {
                            playerAId: params.id
                        },
                        {
                            playerBId: params.id
                        }
                    ]
                }
            ]
        }
    })

    let playerLegs = 0;
    let wonLegs = 0;
    let matchesWon = 0;
    const playerTournaments = new Set();
    const playerOppornents = new Map();
    matches.forEach(match => {
        playerTournaments.add(match.tournamentId);

        playerLegs += match.playerALegs + match.playerBlegs
        wonLegs += match.playerAId == params.id ? match.playerALegs : match.playerBlegs
        if (match.playerAId == params.id) {
            playerOppornents.set(match.playerBId, (playerOppornents.get(match.playerBId) || 0) + 1)
            if (match.playerALegs > match.playerBlegs) {
                matchesWon++
            }
        } else {
            playerOppornents.set(match.playerAId, (playerOppornents.get(match.playerAId) || 0) + 1)
            if (match.playerALegs < match.playerBlegs) {
                matchesWon++
            }
        }
    })
    const frequentOpponents = Array.from(playerOppornents).sort((a, b) => a[1] - b[1]).reverse();

    const throws = await prisma.playerThrow.aggregate({
        where: {
            tournamentId: {
                in: tournamentIds
            },
            playerId: params.id
        },
        _count: {
            id: true,
        },
        _sum: {
            score: true,
            darts: true
        },
        _max: {
            score: true
        }
    })

    const throwsOver80 = await prisma.playerThrow.groupBy({
        by: ["score"],
        where: {
            playerId: params.id,
            tournamentId: {
                in: tournamentIds
            },
            score: {
                gte: 80
            }
        },
        _count: {
            score: true
        }
    })

    const checkouts = await prisma.playerThrow.findMany({
        where: {
            checkout: true,
            playerId: params.id,
            tournamentId: {
                in: tournamentIds
            }
        },
        orderBy: {
            score: "desc"
        }
    })

    const legs = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId", "leg"],
        where: {
            playerId: params.id,
            tournamentId: {
                in: tournamentIds
            }
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
            }
        }
    })
    const legsSorted = legs.sort((a, b) => (a._sum?.darts || 0) - (b._sum?.darts || 0))

    const matchSums = await prisma.playerThrow.groupBy({
        by: ["tournamentId", "matchId"],
        where: {
            playerId: params.id,
            tournamentId: {
                in: tournamentIds
            }
        },
        _sum: {
            score: true,
            darts: true
        }
    })
    const matchAverages = matchSums.map(match => (match._sum.score || 0) / match._sum.darts * 3)
    const bestAvg = matchAverages.sort().reverse();

    function Stat({ name, value }) {
        return (<div className="my-1"><span className="font-bold">{name}: </span>{value}</div>)
    }

    function StatWithNames({ name, value, playerIds }) {
        return (
            <div className="flex flex-row my-1">
                <div className="font-bold">{name}: </div><div className="mx-1">{value}</div>
                {playerIds.map(pid =>
                (
                    <Link key={randomUUID()} href={`/players/${pid}`}>
                        <div className="rounded border border-slate-600 px-2 mx-1 hover:bg-sky-300 bg-slate-200" key={randomUUID()}>{players.get(pid)}</div>
                    </Link>
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
                            <div className="font-bold text-xl">Relax darts cup: štatistiky hráča {players.get(params.id)}</div>
                            <div className="relative flex items-center ml-auto">
                                <nav className="text-sm leading-6 font-semibold text-slate-700">
                                    <ul className="flex space-x-8">
                                        <li>
                                            <Link className="hover:text-sky-500" href="/">Domov</Link>
                                        </li>
                                        <li>
                                            <Link className="hover:text-sky-500" href="/players">Späť</Link>
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
                        <Stat name="Sezóna" value="Jeseň 2024" />
                        <Stat name="Počet odohratých turnajov" value={`${playerTournaments.size} / ${tournamentIds.length} (${(playerTournaments.size / tournamentIds.length * 100).toFixed(1)}%)`} />
                        <Stat name="Počet vyhraných/všetkých zápasov" value={`${matchesWon} / ${matches.length} (${(matchesWon / matches.length * 100).toFixed(1)}%)`} />
                        <Stat name="Počet vyhraných/všetkých legov" value={`${wonLegs} / ${playerLegs} (${(wonLegs / playerLegs * 100).toFixed(1)}%)`} />
                        <Stat name="Počet hodov" value={throws._count.id} />
                        <Stat name="Počet šípok" value={throws._sum.darts} />
                        <Stat name="Priemer za sezónu" value={((throws._sum?.score || 0) / (throws._sum?.darts || 0) * 3).toFixed(2)} />
                        <Stat name="Najlepší hod" value={throws._max.score} />
                        <Stat name="Najlepší leg" value={(legsSorted[0]?._sum?.darts || 0)} />
                        <Stat name="Najlepší checkout" value={checkouts[0]?.score || 0} />
                        <Stat name="Najlepší priemer v zápase" value={(bestAvg[0]).toFixed(2)} />
                        <StatWithNames name="Najčastejší protihráč" value={frequentOpponents[0][1]} playerIds={frequentOpponents.filter(o => o[1] == frequentOpponents[0][1]).map(o => o[0])} />
                        <div>
                            <div className="my-1 flex flex-col-2">
                                <div className="font-bold">Priemery:</div>
                                <ul className="mx-1 flex flex-col-4">
                                    <li><VerticalStat name="45+" value={countAverages(matchAverages, 45, 50)} /></li>
                                    <li><VerticalStat name="50+" value={countAverages(matchAverages, 50, 55)} /></li>
                                    <li><VerticalStat name="55+" value={countAverages(matchAverages, 55, 60)} /></li>
                                    <li><VerticalStat name="60+" value={countAverages(matchAverages, 60, 180)} /></li>
                                </ul>
                            </div>
                            <div className="my-1 flex flex-col-2">
                                <div className="font-bold">Skóre:</div>
                                <ul className="mx-1 flex flex-col-5">
                                    <li><VerticalStat name="80+" value={countThrows(throwsOver80, 80, 100)} /></li>
                                    <li><VerticalStat name="100+" value={countThrows(throwsOver80, 100, 133)} /></li>
                                    <li><VerticalStat name="133+" value={countThrows(throwsOver80, 133, 171)} /></li>
                                    <li><VerticalStat name="171+" value={countThrows(throwsOver80, 171, 180)} /></li>
                                    <li><VerticalStat name="180+" value={countThrows(throwsOver80, 180, 200)} /></li>
                                </ul>
                            </div>
                            <div className="my-1 flex flex-col-2">
                                <div className="font-bold">Checkout:</div>
                                <ul className="mx-1 flex flex-col-5">
                                    <li><VerticalStat name="41+" value={countCheckouts(checkouts, 41, 60)} /></li>
                                    <li><VerticalStat name="60+" value={countCheckouts(checkouts, 60, 80)} /></li>
                                    <li><VerticalStat name="80+" value={countCheckouts(checkouts, 80, 90)} /></li>
                                    <li><VerticalStat name="90+" value={countCheckouts(checkouts, 90, 100)} /></li>
                                    <li><VerticalStat name="100+" value={countCheckouts(checkouts, 100, 180)} /></li>
                                </ul>
                            </div>
                            <div className="my-1 flex">
                                <div className="font-bold">Najlepší leg:</div>
                                <div>
                                    <ul className="mx-1 flex flex-col sm:flex-row">
                                        <li><BigVerticalStat name="5" value={[13, 14, 15]} /></li>
                                        <li><BigVerticalStat name="6" value={[16, 17, 18]} /></li>
                                        <li><BigVerticalStat name="7" value={[19, 20, 21]} /></li>
                                        <li><BigVerticalStat name="8" value={[22, 23, 24]} /></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )

    function BigVerticalStat({ name, value }) {
        return (
            <VerticalStat name={name} value={(
                <ul className="flex flex-col-3">
                    {value.map(co => (
                        <li key={co}><VerticalStat name={co} value={legs.filter(leg => leg._sum.darts == co).reduce((p, c) => p + 1, 0)} extraClass="my-2 sm:my-2" /></li>
                    ))}
                </ul>
            )} />
        )
    }

    function VerticalStat({ name, value, extraClass = "" }) {
        return (
            <div className={`bg-slate-200 flex-row-2 text-center border rounded border-slate-600 mx-2 my-1 sm:my-0 px-3 ${extraClass}`}>
                <div className="border-b border-b-slate-600">{name}</div>
                <div>{value}</div>
            </div>
        )
    }
}

function countThrows(throwsOver80: any[], min: number, max: number) {
    return throwsOver80
        .filter((t: { score: number }) => t.score >= min && t.score < max)
        .reduce((p: number, t: { _count: { score: number } }) => p + t._count.score, 0)
}

function countCheckouts(checkouts: { id: string; tournamentId: string; matchId: string; leg: number; playerId: string; time: Date; score: number; darts: number; doubles: number; checkout: boolean }[], min, max) {
    return checkouts.filter(co => co.score >= min && co.score < max).reduce((p, c) => p + 1, 0)
}

function countAverages(matchAverages: number[], min, max) {
    return matchAverages.filter(avg => avg >= min && avg < max).reduce((p, c) => p + 1, 0)
}
