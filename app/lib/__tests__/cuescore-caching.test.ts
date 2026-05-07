import { describe, expect, test, jest, beforeEach } from '@jest/globals'

jest.mock('@/app/lib/integrations/cuescore', () => ({
  getCueScoreGateway: jest.fn(() => ({
    finishMatch: jest.fn(),
  })),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

describe('Dashboard caching - cuescore invalidation', () => {
  const revalidateTag = (jest.requireMock('next/cache') as Record<string, jest.Mock>).revalidateTag
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('finishMatch invalidates cache for correct table', async () => {
    const { finishMatch } = require('@/app/lib/cuescore')
    
    await finishMatch('t1', 'm1', 2, 1, '6')

    expect(revalidateTag).toHaveBeenCalledWith('match6', 'max')
  })
})