import { apiError } from '@/app/api/_lib/responses'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { NextRequest } from 'next/server'
import { getDashboardTournamentSnapshot } from './snapshot'

export async function GET(request: NextRequest) {
  try {
    const activeTournament = await getActiveTournament()

    if (!activeTournament) {
      return apiError('ACTIVE_TOURNAMENT_NOT_SET', 'No active tournament is selected.', { status: 404 })
    }

    const test = request.nextUrl.searchParams.get('test') === 'true'
    return Response.json(await getDashboardTournamentSnapshot(activeTournament.id, test))
  } catch (error) {
    console.error('Failed to load active dashboard snapshot', { error })
    return apiError('DASHBOARD_ACTIVE_FETCH_FAILED', 'Unable to load active dashboard snapshot', { status: 500 })
  }
}
