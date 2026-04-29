import { Suspense } from 'react'
import { createMatch, getCuescoreMatch } from '@/app/lib/match'
import Darts from './[id]/tables/[table]/darts'
import Wait from './[id]/tables/[table]/wait'

type TableScoreboardSearchParams = {
  reset?: string
  slow?: string
}

export default async function TableScoreboardPage({
  encodedTable,
  searchParams,
  tournamentId,
}: {
  encodedTable: string
  searchParams: TableScoreboardSearchParams
  tournamentId: string
}) {
  const table = decodeURIComponent(encodedTable)
  const slow = searchParams.slow === 'true'
  const reset = searchParams.reset === 'true'

  let match = null

  try {
    const cueScoreMatch = await getCuescoreMatch(tournamentId, encodedTable)
    match = await createMatch(cueScoreMatch)
  } catch (e) {
    console.log(e)
    return <Wait id={tournamentId} table={encodedTable} />
  }

  return (
    <Suspense fallback={<div className="flex h-dvh bg-slate-300 text-center text-2xl text-blue-700"><div className="m-auto">Loading...</div></div>}>
      <Darts table={table} matchId={match.id} slow={slow} reset={reset} tournamentId={tournamentId} />
    </Suspense>
  )
}
