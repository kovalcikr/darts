import NoActiveTournament from '@/app/components/NoActiveTournament'
import { getActiveTournament } from '@/app/lib/active-tournament'
import type { RouteParams } from '@/app/lib/next-types'
import TableScoreboardPage from '@/app/tournaments/table-scoreboard-page'

export const dynamic = 'force-dynamic'

export default async function ActiveTournamentTablePage({
  params,
}: {
  params: RouteParams<{ table: string }>
}) {
  const { table: encodedTable } = await params
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
    />
  )
}
