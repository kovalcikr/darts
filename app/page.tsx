import { randomUUID } from "crypto";
import prisma from "./lib/db";
import { getPlayers } from "./lib/players";
import { getTournaments } from "./lib/tournament";
import Link from "next/link";

export const revalidate = false

export default async function Home() {
  const tournaments = await getTournaments()
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
  const sortedThrows = throwsPerPlayer.sort((a, b) => a._sum.score / a._sum.darts - b._sum.score / b._sum.darts).reverse()

  const players = await getPlayers(tournaments);

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
  const bestLeg = legsSorted.filter(leg => leg._sum.darts == legsSorted[0]._sum.darts);

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
            <div className="rounded border border-black px-2 mx-1 hover:bg-sky-300 bg-slate-200" >{players.get(pid)}</div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed w-full min-h-full text-gray-900 bg-white overflow-x-scroll">
      <header className="sticky top-0 z-40 w-full backdrop-blur flex-none">
        <div className="max-w-7xl mx-auto">
          <div className="py-4 px-4">
            <div className="relative flex items-center">
              <div className="font-bold text-xl">Relax darts cup</div>
              <div className="relative flex items-center ml-auto">
                <nav className="text-sm leading-6 font-semibold text-slate-700">
                  <ul className="flex space-x-8">
                    <li>
                      <Link className="hover:text-sky-500" href="/players">Štatistiky hráčov</Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-auto relative border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="text-gray-700 text-base">
            <Stat name="Sezóna" value="Jeseň 2024" />
            <Stat name="Počet hráčov" value={players.size} />
            <Stat name="Počet turnajov" value="12" />
            <Stat name="Počet zápasov" value={matchesCount._count.id} />
            <Stat name="Počet legov" value={matchesCount._sum.playerALegs + matchesCount._sum.playerBlegs} />
            <Stat name="Počet hodov" value={throws._count.id} />
            <Stat name="Počet šípok" value={throwsPerPlayer.reduceRight((total, t) => total + t._sum.darts, 0)} />
            <Stat name="Počet 180" value={throw180count._count.id} />
            <Stat name="Počet 171+" value={throw171plusCount._count.id} />
            <Stat name="Priemer všetkých hráčov" value={(throws._sum.score / throws._sum.darts * 3).toFixed(2)} />
            <StatWithNames name="Najlepší sezónny priemer" value={(sortedThrows[0]._sum.score / sortedThrows[0]._sum.darts * 3).toFixed(2)} playerIds={[sortedThrows[0].playerId]} />
            <StatWithNames name="Najlepší checkout" value={bestCheckout[0].score}
              playerIds={bestCheckout.filter(checkout => bestCheckout[0].score == checkout.score).map(checkout => checkout.playerId)} />

            {/* <StatWithNames name="Najlepší leg" value={legsSorted[0]._sum.darts}
              names={bestLeg.map(leg => players.get(leg.playerId))} /> */}
            <div className="flex flex-row">
              <div className="font-bold">Najlepší leg: </div><div className="mx-1">15</div>
              <Link href="/players/45506878"><div className="rounded border border-black px-2 mx-1 hover:bg-sky-300 bg-slate-200">Marián - Lalky Lalkovič (3x)</div></Link>
              <Link href="/players/39928879"><div className="rounded border border-black px-2 mx-1 hover:bg-sky-300 bg-slate-200">Ľubo Lechman</div></Link>
              <Link href="/players/2472554"><div className="rounded border border-black px-2 mx-1 hover:bg-sky-300 bg-slate-200">Tomas Klobusnik</div></Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}