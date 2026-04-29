import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { GET } from '../route'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { getDashboardTournamentSnapshot } from '../snapshot'
import { NextRequest } from 'next/server'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('../snapshot', () => ({
  getDashboardTournamentSnapshot: jest.fn(),
}))

describe('/api/dashboard active tournament route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns a not found error when no active tournament is selected', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost:3000/api/dashboard'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('ACTIVE_TOURNAMENT_NOT_SET')
    expect(getDashboardTournamentSnapshot).not.toHaveBeenCalled()
  })

  test('loads the active tournament dashboard snapshot', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({ id: 'active-t1', name: 'Active Cup' } as never)
    jest.mocked(getDashboardTournamentSnapshot).mockResolvedValue({ match1: { matchId: 'm1' } } as never)

    const response = await GET(new NextRequest('http://localhost:3000/api/dashboard?test=true'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ match1: { matchId: 'm1' } })
    expect(getDashboardTournamentSnapshot).toHaveBeenCalledWith('active-t1', true)
  })
})
