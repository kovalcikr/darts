import NoActiveTournament from '@/app/components/NoActiveTournament'
import TableRemoved from '@/app/components/TableRemoved'
import { getActiveTournament } from '@/app/lib/active-tournament'
import type { RouteParams } from '@/app/lib/next-types'
import { getTableMappingBySlot } from '@/app/lib/table-mappings'
import TableScoreboardPage from '@/app/tournaments/table-scoreboard-page'

export const dynamic = 'force-dynamic'

export default async function ActiveTournamentTablePage({
  params,
}: {
  params: RouteParams<{ table: string }>
}) {
  const { table: encodedTable } = await params
  const slot = parseInt(decodeURIComponent(encodedTable), 10)
  const mapping = await getTableMappingBySlot(slot)

  if (!mapping) {
    return <TableRemoved />
  }

  const activeTournament = await getActiveTournament()

  if (!activeTournament) {
    return (
      <NoActiveTournament
        title="No active tournament for this table"
      />
    )
  }

  return (
    <TableScoreboardPage
      encodedTable={encodedTable}
      tournamentId={activeTournament.id}
      mapping={mapping}
    />
  )
}
