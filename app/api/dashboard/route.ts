import { apiError } from '@/app/api/_lib/responses'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { NextRequest } from 'next/server'
import { getDashboardSnapshot } from '@/app/lib/table-slot'

export async function GET(request: NextRequest) {
  try {
    const activeTournament = await getActiveTournament()

    if (!activeTournament) {
      return apiError('ACTIVE_TOURNAMENT_NOT_SET', 'No active tournament is selected.', { status: 404 })
    }

    return Response.json(await getDashboardSnapshot(activeTournament.id))
  } catch (error) {
    console.error('Failed to load active dashboard snapshot', { error })
    return apiError('DASHBOARD_ACTIVE_FETCH_FAILED', 'Unable to load active dashboard snapshot', { status: 500 })
  }
}
