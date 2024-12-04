import prisma from "@/app/lib/db"
import { getPlayers } from "@/app/lib/players"
import { getTournaments } from "@/app/lib/tournament"

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
            id: true
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

    const checkoutDarts = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

    return (
        <div className="flex flex-col h-dvh font-normal text-black bg-slate-300">
            <div className="max-w-screen-md rounded shadow-lg">
                <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">Relax darts cup: štatistiky hráča {players.get(params.id)}</div>
                    <div className="text-gray-700 text-base">
                        <div>Sezóna: Jeseň 2024</div>
                        <div>Počet odohratých turnajov: {playerTournaments.size} / {tournamentIds.length} ({(playerTournaments.size / tournamentIds.length * 100).toFixed(1)}%)</div>
                        <div>Počet vyhraných/všetkých zápasov: {matchesWon} / {matches.length} ({(matchesWon / matches.length * 100).toFixed(1)}%)</div>
                        <div>Počet vyhraných/všetkých legov: {wonLegs} / {playerLegs} ({(wonLegs / playerLegs * 100).toFixed(1)}%)</div>
                        <div>Počet hodov: {throws._count.id}</div>
                        <div>Počet šípok: {throws._sum.darts}</div>
                        <div>Priemer za sezónu: {((throws._sum?.score || 0) / (throws._sum?.darts || 0) * 3).toFixed(2)} </div>
                        <div>Najlepší hod: {throws._max.score} </div>
                        <div>Najlepší leg: {(legsSorted[0]?._sum?.darts || 0)}</div>
                        <div>Najlepší checkout: {checkouts[0]?.score || 0}</div>
                        <div>Najlepší priemer v zápase: {(bestAvg[0]).toFixed(2)} </div>
                        <div>Najčastejší protihráč: {frequentOpponents[0][1]} - {
                            frequentOpponents.filter(o => o[1] == frequentOpponents[0][1]).map(oppoenent => (
                                <span key={oppoenent[0]}>({players.get(oppoenent[0])}) </span>
                            ))
                        }</div>
                        <div className="grid grid-rows-4">
                            <div className="grid grid-cols-6">
                                <div>Priemer</div>
                                <div>45+: { countAverages(matchAverages, 45, 50) } </div>
                                <div>50+: { countAverages(matchAverages, 50, 55) }</div>
                                <div>55+: { countAverages(matchAverages, 55, 60) }</div>
                                <div>60+: { countAverages(matchAverages, 60, 180) }</div>
                            </div>
                            <div className="grid grid-cols-6">
                                <div>Skore</div>
                                <div>80+: { countThrows(throwsOver80, 80, 100) }</div>
                                <div>100+: { countThrows(throwsOver80, 100, 133) }</div>
                                <div>133+: { countThrows(throwsOver80, 133, 171) }</div>
                                <div>171+: { countThrows(throwsOver80, 171, 180) }</div>
                                <div>180: { countThrows(throwsOver80, 180, 200) }</div>
                            </div>
                            <div className="grid grid-cols-6">
                                <div>Checkout</div>
                                <div>41+: { countCheckouts(checkouts, 41, 60) }</div>
                                <div>60+: { countCheckouts(checkouts, 60, 80) }</div>
                                <div>80+: { countCheckouts(checkouts, 80, 90) }</div>
                                <div>90+: { countCheckouts(checkouts, 90, 100) }</div>
                                <div>100+: { countCheckouts(checkouts, 100, 180) }</div>
                            </div>
                            <div className="flex flex-col">
                                <div>Best leg</div>
                                <div className="grid grid-cols-12">
                                    { checkoutDarts.map(co => (
                                        <div>{co}: { legs.filter(leg => leg._sum.darts == co).reduce((p, c) => p + 1, 0) }</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function countThrows(throwsOver80, min, max) {
    return throwsOver80.filter(t => t.score >= min && t.score < max).reduce((p, t) => p + t._count.score, 0)
}

function countCheckouts(checkouts: { id: string; tournamentId: string; matchId: string; leg: number; playerId: string; time: Date; score: number; darts: number; doubles: number; checkout: boolean }[], min, max) {
    return checkouts.filter(co => co.score >= min && co.score < max).reduce((p, c) => p + 1, 0)
}

function countAverages(matchAverages: number[], min, max) {
    return matchAverages.filter(avg => avg >= min && avg < max).reduce((p, c) => p + 1, 0)
}
