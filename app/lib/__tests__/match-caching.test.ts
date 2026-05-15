import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as data from '@/app/lib/data'
import * as cuescore from '@/app/lib/cuescore'

jest.mock('@/app/lib/data', () => ({
  updateMatchFirstPlayer: jest.fn(),
}))

jest.mock('@/app/lib/cuescore', () => ({
  getCueScoreGateway: jest.fn(),
}))

jest.mock('@/app/lib/cache/revalidation', () => ({
  revalidateTableById: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('Dashboard caching - match invalidation', () => {
  const { revalidateTableById } = jest.requireMock('@/app/lib/cache/revalidation') as Record<string, jest.Mock>
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('startMatch invalidates cache for correct table', async () => {
    const { startMatch } = require('@/app/lib/match')
    
    const formData = new FormData()
    formData.set('matchId', 'm1')
    formData.set('firstPlayer', 'p1')
    formData.set('table', '3')

    const { redirect } = require('next/navigation')
    await startMatch(formData)

    expect(revalidateTableById).toHaveBeenCalledWith('3')
    expect(redirect).toHaveBeenCalledWith('/tables/3')
  })
})