import { Suspense } from 'react'
import { createMatch, getCuescoreMatch } from '@/app/lib/match'
import Darts from './[id]/tables/[table]/darts'
import Wait from './[id]/tables/[table]/wait'
import type { TableMapping } from '@/app/lib/table-mappings'

export default async function TableScoreboardPage({
  encodedTable,
  tournamentId,
  mapping,
}: {
  encodedTable: string
  tournamentId: string
  mapping: TableMapping
}) {
  const slot = decodeURIComponent(encodedTable)

  let match = null

  try {
    const cueScoreMatch = await getCuescoreMatch(tournamentId, mapping.cuescoreTableName)
    match = await createMatch(cueScoreMatch, slot)
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
