import Link from 'next/link'
import NoActiveTournament from '@/app/components/NoActiveTournament'
import { getActiveTournament } from '@/app/lib/active-tournament'

export const dynamic = 'force-dynamic'

export default async function ActiveTournamentTablesPage() {
  const activeTournament = await getActiveTournament()
  const tables = [
    { label: 'Table 1', table: '11' },
    { label: 'Table 2', table: '12' },
    { label: 'Table 3', table: '13' },
    { label: 'Table 4', table: '14' },
    { label: 'Table 5', table: '15' },
    { label: 'Table 6', table: '16' },
  ]

  if (!activeTournament) {
    return <NoActiveTournament title="No active tournament for tables" />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <header className="border-b border-gray-700 bg-gray-900/70">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Relax Darts Cup
          </div>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Tables
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                {activeTournament.name}
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-gray-400 transition-colors hover:bg-white/5 hover:text-sky-400"
              href="/"
            >
              Back to overview
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((item) => (
            <Link
              key={item.table}
              className="group rounded-lg bg-gray-800/50 p-6 text-center ring-1 ring-white/10 transition-colors hover:bg-gray-800 hover:ring-sky-500/40"
              href={`/tables/${item.table}`}
            >
              <div className="text-sm font-medium uppercase tracking-wider text-gray-400">
                Scoreboard
              </div>
              <div className="mt-2 text-4xl font-semibold text-white group-hover:text-sky-300">
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
