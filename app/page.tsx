import prisma from "./lib/db";

export const revalidate = false

export default async function Home() {
  const tournamentNames = generateTournamentNames(13, 24);
  const tournamentIds = await prisma.tournament.findMany({
    where: {
      name: {
        in: tournamentNames
      }
    }
  });
  const tournaments = tournamentIds.map(tourament => tourament.id);
  const matchesCount = await prisma.match.aggregate({
    _count: {
      id: true
    },
    _sum: {
      playerALegs: true,
      playerBlegs: true
    },
    where: {
      tournamentId: {
        in: tournaments
      }
    }
  })

  const throw180count = await prisma.playerThrow.aggregate({
    _count: {
      id: true
    },
    where: {
      tournamentId: {
        in: tournaments
      },
      score: 180
    }
  })

  const throw171count = await prisma.playerThrow.aggregate({
    _count: {
      id: true
    },
    where: {
      tournamentId: {
        in: tournaments
      },
      score: 171
    }
  })

  const throws = await prisma.playerThrow.aggregate({
    _count: {
      id: true
    },
    _sum: {
      score: true,
      darts: true
    },
    where: {
      tournamentId: {
        in: tournaments
      }
    }
  })

  const throwsPerPlayer = await prisma.playerThrow.groupBy({
    by: ["playerId"],
    where: {
      tournamentId: {
        in: tournaments
      }
    },
    _sum: {
      score: true,
      darts: true
    }
  });
  const sortedThrows = throwsPerPlayer.sort((a, b) => a._sum.score / a._sum.darts - b._sum.score / b._sum.darts).reverse()

  function generateTournamentNames(start, end) {
    const names = [];
    for (let i = start; i <= end; i++) {
      names.push("Relax Darts CUP " + i + " 2024")
    }
    return names;
  }

  const playersA = await prisma.match.findMany({
    where: {
      tournamentId: {
        in: tournaments
      }
    },
    distinct: ["playerAId"],
    select: {
      playerAId: true,
      playerAName: true
    }
  })
  const playersB = await prisma.match.findMany({
    where: {
      tournamentId: {
        in: tournaments
      }
    },
    distinct: ["playerBId"],
    select: {
      playerBId: true,
      playerBName: true
    }
  })
  const players = new Map();
  playersA.forEach(value => players.set(value.playerAId, value.playerAName))
  playersB.forEach(value => players.set(value.playerBId, value.playerBName))

  const legs = await prisma.playerThrow.groupBy({
    by: ["tournamentId", "matchId", "leg", "playerId"],
    where: {
      tournamentId: {
        in: tournaments
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
  const legsSorted = legs.sort((a, b) => a._sum.darts - b._sum.darts)

  const bestCheckout = await prisma.playerThrow.findMany({
    where: {
      checkout: true,
      tournamentId: {
        in: tournaments
      }
    },
    orderBy: {
      score: "desc"
    }
  })

  return (
    <div className="flex flex-col h-dvh font-normal text-black bg-slate-300">
      <div className="max-w-screen-md rounded shadow-lg">
        <div className="px-6 py-4">
          <div className="font-bold text-xl mb-2">Relax darts cup</div>
          <div className="text-gray-700 text-base">
            <div>Season: Leto 2024</div>
            <div>Players: {players.size}</div>
            <div>Tournaments: 12</div>
            <div>Matches: {matchesCount._count.id}</div>
            <div>Legs: {matchesCount._sum.playerALegs + matchesCount._sum.playerBlegs}</div>
            <div>Throws: {throws._count.id}</div>
            <div>180: {throw180count._count.id}</div>
            <div>171: {throw171count._count.id}</div>
            <div>Average: {(throws._sum.score / throws._sum.darts * 3).toFixed(2)} </div>
            <div>Best average: {(sortedThrows[0]._sum.score / sortedThrows[0]._sum.darts * 3).toFixed(2)} ({players.get(sortedThrows[0].playerId)})</div>
            <div>Best checkout: { bestCheckout[0].score } - { 
              bestCheckout.filter(checkout => bestCheckout[0].score == checkout.score).map(checkout => (
                <span key={checkout.id}>({ players.get(checkout.playerId) }) </span>
              ))
            } </div>
            <div>Best leg: {legs[0]._sum.darts} - {
              legsSorted.filter(leg => leg._sum.darts == legs[0]._sum.darts).map(leg => (
                <span key={leg.tournamentId.toString().concat(leg.leg.toString(), leg.playerId)}>({players.get(leg.playerId)}) </span>
              ))
            }</div>
          </div>
        </div>
      </div>
    </div>
  )
}
