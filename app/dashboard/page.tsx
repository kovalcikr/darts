import NoActiveTournament from '@/app/components/NoActiveTournament'
import { getActiveTournament } from '@/app/lib/active-tournament'
import DashboardView from './dashboard-view'

export const dynamic = 'force-dynamic'

export default async function ActiveTournamentDashboardPage() {
  const activeTournament = await getActiveTournament()

  if (!activeTournament) {
    return (
      <NoActiveTournament
        title="No active tournament for dashboard"
        message="Set an active tournament in admin before opening the fixed dashboard."
      />
    )
  }

  return <DashboardView tournamentId={activeTournament.id} />
}
