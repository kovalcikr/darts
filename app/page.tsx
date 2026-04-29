import { randomUUID } from "crypto";
import prisma from "./lib/db";
import { getPlayers } from "./lib/players";
import { getTournaments } from "./lib/tournament";
import Link from "next/link";
import type { PageSearchParams } from "./lib/next-types";
import StatsPageShell from "./components/StatsPageShell";
import { withSeason } from "./lib/season-links";

export const revalidate = false
export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const season = resolvedSearchParams.season as string || "2026";
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
      undoneAt: null,
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
      undoneAt: null,
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
      },
      undoneAt: null,
    }
  })

  const throwsPerPlayer = await prisma.playerThrow.groupBy({
    by: ["playerId"],
    where: {
      tournamentId: {
        in: tournaments
      },
      undoneAt: null,
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
      },
      undoneAt: null,
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
      },
      undoneAt: null,
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
      undoneAt: null,
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
            <Link key={randomUUID()} href={withSeason(`/players/${pid}`, season)}>
              <div className="rounded-full bg-sky-600/50 px-3 py-1 text-sm font-semibold text-sky-200 mr-2 mb-2 hover:bg-sky-500/50 transition-colors" >{players[pid]}</div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <StatsPageShell
      activeSection="overview"
      season={season}
      subtitle={`Celkové štatistiky zo všetkých turnajov pre sezónu ${season}.`}
      title="Celkové štatistiky"
    >
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl tracking-tight">
              Sezóna <span className="text-sky-400">{season}</span>
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
    </StatsPageShell>
  )
}
