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

    const bestCheckout = await prisma.playerThrow.findMany({
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
    const bestAvg = matchSums.sort((a, b) => (a._sum?.score || 0) / (a._sum?.darts || 0) - (b._sum.score || 0) / (b._sum.darts || 0)).reverse();

    return (
        <div className="flex flex-col h-dvh font-normal text-black bg-slate-300">
            <div className="max-w-screen-md rounded shadow-lg">
                <div className="px-6 py-4">
                    <div className="font-bold text-xl mb-2">Relax darts cup</div>
                    <div className="text-gray-700 text-base">
                        <div>Season: Leto 2024</div>
                        <div>Player: {players.get(params.id)}</div>
                        <div>Tournaments: {playerTournaments.size} / {tournamentIds.length} ({(playerTournaments.size / tournamentIds.length * 100).toFixed(1)}%)</div>
                        <div>Matches: {matchesWon} / {matches.length} ({(matchesWon / matches.length * 100).toFixed(1)}%)</div>
                        <div>Legs: {wonLegs} / {playerLegs} ({(wonLegs / playerLegs * 100).toFixed(1)}%)</div>
                        <div>Throws: {throws._count.id}</div>
                        <div>Average (season): {((throws._sum?.score || 0) / (throws._sum?.darts || 0) * 3).toFixed(2)} </div>
                        <div>Best throw: {throws._max.score} </div>
                        <div>Best leg: { (legsSorted[0]?._sum?.darts || 0)}</div>
                        <div>Best checkout: {bestCheckout[0]?.score || 0}</div>
                        <div>Best average: { ((bestAvg[0]._sum?.score || 0) / (bestAvg[0]._sum?.darts || 0) * 3).toFixed(2) } </div>
                        <div>Frequent opponent: {frequentOpponents[0][1]} - {
                            frequentOpponents.filter(o => o[1] == frequentOpponents[0][1]).map(oppoenent => (
                                <span key={oppoenent[0]}>({players.get(oppoenent[0])}) </span>
                            ))
                        }</div>
                    </div>
                </div>
            </div>
        </div>
    )
}