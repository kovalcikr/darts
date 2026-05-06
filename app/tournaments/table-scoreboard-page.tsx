import { Suspense } from 'react'
import { createMatch, getCuescoreMatch } from '@/app/lib/match'
import Darts from './[id]/tables/[table]/darts'
import Wait from './[id]/tables/[table]/wait'
import { getTableIdBySlot } from '@/app/lib/table-mappings'

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
  const slot = decodeURIComponent(encodedTable)
  const slow = searchParams.slow === 'true'
  const reset = searchParams.reset === 'true'

  // Resolve slot to CueScore table name
  const cuescoreTableId = await getTableIdBySlot(parseInt(slot, 10))

  let match = null

  try {
    const cueScoreMatch = await getCuescoreMatch(tournamentId, cuescoreTableId)
    match = await createMatch(cueScoreMatch, slot)
  } catch (e) {
    console.log(e)
    return <Wait id={tournamentId} table={slot} />
  }

  return (
    <Suspense fallback={<div className="flex h-dvh bg-gray-900 text-center text-2xl text-sky-300"><div className="m-auto">Loading...</div></div>}>
      <Darts table={slot} matchId={match.id} slow={slow} reset={reset} tournamentId={tournamentId} />
    </Suspense>
  )
}
