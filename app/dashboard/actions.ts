'use server'

import { getActiveTournament } from '@/app/lib/active-tournament'
import { getDashboardSnapshot } from '@/app/lib/dashboard/snapshot'

export async function fetchDashboardSnapshot() {
  const activeTournament = await getActiveTournament()
  if (!activeTournament) return null
  return getDashboardSnapshot(activeTournament.id)
}