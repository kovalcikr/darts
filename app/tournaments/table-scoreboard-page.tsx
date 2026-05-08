import { Suspense } from 'react'
import { ingestCuescoreMatch } from '@/app/lib/match-ingestion'
import Darts from './[id]/tables/[table]/darts'
import Wait from './[id]/tables/[table]/wait'
import { getTableIdBySlot } from '@/app/lib/table-mappings'

export default async function TableScoreboardPage({
  encodedTable,
  tournamentId,
}: {
  encodedTable: string
  tournamentId: string
}) {
  const slot = decodeURIComponent(encodedTable)

  // Resolve slot to CueScore table name
  const cuescoreTableId = await getTableIdBySlot(parseInt(slot, 10))

  let match = null

try {
    match = await ingestCuescoreMatch(tournamentId, cuescoreTableId, slot)
  } catch (e) {
    console.log(e)
    return <Wait id={tournamentId} table={slot} />
  }

  return (
    <Suspense fallback={<div className="flex h-dvh bg-gray-900 text-center text-2xl text-sky-300"><div className="m-auto">Loading...</div></div>}>
      <Darts table={slot} matchId={match.id} tournamentId={tournamentId} />
    </Suspense>
  )
}
