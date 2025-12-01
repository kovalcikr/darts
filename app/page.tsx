import { randomUUID } from "crypto";
import prisma from "./lib/db";
import { getPlayers } from "./lib/players";
import { getTournaments } from "./lib/tournament";
import Link from "next/link";

export const revalidate = false
export const dynamic = 'force-dynamic'

import SeasonSelector from "./components/SeasonSelector";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const season = searchParams.season as string || "2025";
  const tournaments = await getTournaments(season)
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

  const throw171plusCount = await prisma.playerThrow.aggregate({
    _count: {
      id: true
    },
    where: {
      tournamentId: {
        in: tournaments
      },
      score: {
        gte: 171,
        lt: 180
      }
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

  const players = await getPlayers(tournaments);

  const sortedThrows = throwsPerPlayer
    .filter(p => players[p.playerId])
    .sort((a, b) => (b._sum.score / b._sum.darts) - (a._sum.score / a._sum.darts));

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
  const bestLeg = legsSorted.length > 0 ? legsSorted.filter(leg => leg._sum.darts == legsSorted[0]._sum.darts) : [];

  const bestCheckoutResult = await prisma.playerThrow.findMany({
    where: {
      checkout: true,
      tournamentId: {
        in: tournaments
      }
    },
    orderBy: {
      score: "desc"
    },
    take: 1
  })

  const bestCheckouts = bestCheckoutResult.length > 0 ? await prisma.playerThrow.findMany({
    where: {
      checkout: true,
      tournamentId: {
        in: tournaments
      },
      score: bestCheckoutResult[0].score
    }
  }) : [];

  function Stat({ name, value }) {
    return (
      <div className="bg-gray-800/50 p-4 rounded-lg text-center ring-1 ring-white/10">
        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{name}</div>
        <div className="mt-1 text-3xl font-semibold text-white">{value}</div>
      </div>
    )
  }
  
  function StatWithNames({ name, value, playerIds }) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg ring-1 ring-white/10">
        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{name}</div>
        <div className="mt-1 text-3xl font-semibold text-white">{value}</div>
        <div className="flex flex-row flex-wrap items-center mt-3">
          {playerIds.map(pid =>
          (
            <Link key={randomUUID()} href={`/players/${pid}`}>
              <div className="rounded-full bg-sky-600/50 px-3 py-1 text-sm font-semibold text-sky-200 mr-2 mb-2 hover:bg-sky-500/50 transition-colors" >{players[pid]}</div>
            </Link>
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
              <div className="font-bold text-xl text-white">Relax Darts Cup</div>
              <div className="relative flex items-center ml-auto">
                <nav className="text-sm leading-6 font-semibold text-gray-400">
                  <ul className="flex space-x-4 md:space-x-8">
                    <li>
                      <Link className="hover:text-sky-400 transition-colors" href={`/players?season=${season}`}>Štatistiky hráčov</Link>
                    </li>
                    <li>
                      <Link className="hover:text-sky-400 transition-colors" href={`/stats/tournaments?season=${season}`}>Štatistiky turnajov</Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="mb-8">
              <SeasonSelector season={season} />
            </div>
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl tracking-tight">
              Sezóna <span className="text-sky-400">Jeseň {season}</span>
            </h1>
            <p className="mt-4 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Celkové štatistiky zo všetkých turnajov.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat name="Hráčov" value={Object.keys(players).length} />
            <Stat name="Turnajov" value={tournaments.length} />
            <Stat name="Zápasov" value={matchesCount._count.id} />
            <Stat name="Legov" value={matchesCount._sum.playerALegs + matchesCount._sum.playerBlegs} />
            <Stat name="Hodov" value={throws._count.id} />
            <Stat name="Šípok" value={throws._sum.darts} />
            <Stat name="180s" value={throw180count._count.id} />
            <Stat name="170+" value={throw171plusCount._count.id} />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedThrows.length > 0 && <StatWithNames name="Najlepší priemer" value={(sortedThrows[0]._sum.score / sortedThrows[0]._sum.darts * 3).toFixed(2)} playerIds={[sortedThrows[0].playerId]} />}
            {bestCheckouts.length > 0 && <StatWithNames name="Najlepší checkout" value={bestCheckouts[0].score}
              playerIds={Array.from(new Set(bestCheckouts.map(checkout => checkout.playerId)))} />}
            {bestLeg.length > 0 && <StatWithNames name="Najlepší leg" value={bestLeg[0]._sum.darts}
              playerIds={Array.from(new Set(bestLeg.map(leg => leg.playerId)))} />}
          </div>

        </div>
      </main>
    </div>
  )
}