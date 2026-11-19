import { randomUUID } from "crypto";
import { getSeasonStats } from "./lib/season-stats";
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
  const stats = await getSeasonStats(season)

  function Stat({ name, value, testId = undefined }) {
    return (
      <div className="bg-gray-800/50 p-4 rounded-lg text-center ring-1 ring-white/10">
        <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{name}</div>
        <div className="mt-1 text-3xl font-semibold text-white" data-testid={testId}>{value}</div>
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
              <div className="rounded-full bg-sky-600/50 px-3 py-1 text-sm font-semibold text-sky-200 mr-2 mb-2 hover:bg-sky-500/50 transition-colors" >{stats.playerNames[pid]}</div>
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
            <Stat name="Hráčov" value={stats.playerCount} />
            <Stat name="Turnajov" value={stats.tournamentCount} />
            <Stat name="Zápasov" value={stats.matchCount} />
            <Stat name="Legov" value={stats.legCount} />
            <Stat name="Hodov" value={stats.throwCount} testId="season-stat-throws" />
            <Stat name="Šípok" value={stats.dartCount} />
            <Stat name="180s" value={stats.count180} />
            <Stat name="170+" value={stats.count171Plus} />
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.bestAverage && <StatWithNames name="Najlepší priemer" value={stats.bestAverage.threeDartAverage.toFixed(2)} playerIds={stats.bestAverage.playerIds} />}
            {stats.bestCheckout && <StatWithNames name="Najlepší checkout" value={stats.bestCheckout.score}
              playerIds={stats.bestCheckout.playerIds} />}
            {stats.bestLeg && <StatWithNames name="Najlepší leg" value={stats.bestLeg.darts}
              playerIds={stats.bestLeg.playerIds} />}
          </div>
    </StatsPageShell>
  )
}
