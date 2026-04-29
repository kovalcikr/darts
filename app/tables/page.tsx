import Link from 'next/link'
import NoActiveTournament from '@/app/components/NoActiveTournament'
import { getActiveTournament } from '@/app/lib/active-tournament'

export const dynamic = 'force-dynamic'

export default async function ActiveTournamentTablesPage() {
  const activeTournament = await getActiveTournament()
  const tables = ['1', '2', '3', '4', '5', '6']

  if (!activeTournament) {
    return <NoActiveTournament title="No active tournament for tables" />
  }

  return (
    <div className="h-dvh bg-slate-200">
      <div className="p-4 text-xl font-bold text-slate-900">{activeTournament.name}</div>
      {tables.map((item: string) => (
        <div key={item} className="m-4">
          <Link className="border-slate-800 rounded bg-blue-200 p-1 px-8" href={`/tables/1${item}`}>Table {item}</Link>
        </div>
      ))}
      <div key="back" className="m-4">
        <Link className="border-slate-800 rounded bg-red-200 p-1 px-8" href="/">Back</Link>
      </div>
    </div>
  )
}
