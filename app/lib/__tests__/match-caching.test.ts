import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as data from '@/app/lib/data'
import * as cuescore from '@/app/lib/cuescore'

jest.mock('@/app/lib/data', () => ({
  updateMatchFirstPlayer: jest.fn(),
}))

jest.mock('@/app/lib/cuescore', () => ({
  getCueScoreGateway: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

describe('Dashboard caching - match invalidation', () => {
  const { revalidateTag } = jest.requireMock('next/cache') as Record<string, jest.Mock>
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('startMatch invalidates cache for correct table', async () => {
    const { startMatch } = require('@/app/lib/match')
    
    const formData = new FormData()
    formData.set('matchId', 'm1')
    formData.set('firstPlayer', 'p1')
    formData.set('table', '3')

    await startMatch(formData)

    expect(revalidateTag).toHaveBeenCalledWith('match3', 'max')
  })
})