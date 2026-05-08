import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { GET } from '../route'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { getDashboardSnapshot } from '@/app/lib/dashboard/snapshot'
import { NextRequest } from 'next/server'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('@/app/lib/dashboard/snapshot', () => ({
  getDashboardSnapshot: jest.fn(),
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
    expect(getDashboardSnapshot).not.toHaveBeenCalled()
  })

  test('loads the active tournament dashboard snapshot', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({ id: 'active-t1', name: 'Active Cup' } as never)
    jest.mocked(getDashboardSnapshot).mockResolvedValue({
      matches: [{ matchId: 'm1' }, null, null, null, null, null],
      liveStates: [null, null, null, null, null, null],
      tableIds: ['1', null, null, null, null, null],
    } as never)

    const response = await GET(new NextRequest('http://localhost:3000/api/dashboard'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.matches).toHaveLength(6)
    expect(getDashboardSnapshot).toHaveBeenCalledWith('active-t1')
  })
})