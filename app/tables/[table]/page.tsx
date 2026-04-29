import NoActiveTournament from '@/app/components/NoActiveTournament'
import { getActiveTournament } from '@/app/lib/active-tournament'
import type { PageSearchParams, RouteParams } from '@/app/lib/next-types'
import TableScoreboardPage from '@/app/tournaments/table-scoreboard-page'

export const dynamic = 'force-dynamic'

export default async function ActiveTournamentTablePage({
  params,
  searchParams,
}: {
  params: RouteParams<{ table: string }>
  searchParams: PageSearchParams<{ reset?: string; slow?: string }>
}) {
  const { table: encodedTable } = await params
  const resolvedSearchParams = await searchParams
  const activeTournament = await getActiveTournament()

  if (!activeTournament) {
    return (
      <NoActiveTournament
        title="No active tournament for this table"
        message="Set an active tournament in admin before opening fixed table scoreboards."
      />
    )
  }

  return (
    <TableScoreboardPage
      encodedTable={encodedTable}
      searchParams={resolvedSearchParams}
      tournamentId={activeTournament.id}
    />
  )
}
