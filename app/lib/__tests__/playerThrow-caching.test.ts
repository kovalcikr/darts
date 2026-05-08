import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as data from '@/app/lib/data'
import * as cuescore from '@/app/lib/cuescore'
import prisma from '@/app/lib/db'

jest.mock('@/app/lib/data', () => ({
  aggregatePlayerThrow: jest.fn().mockResolvedValue({ _sum: { score: 0, darts: 0 } }),
  invalidateRedoableThrows: jest.fn().mockResolvedValue(undefined),
  createPlayerThrow: jest.fn().mockResolvedValue(undefined),
  findMatch: jest.fn().mockResolvedValue({ tournamentId: 't1', id: 'm1', playerALegs: 0, playerBlegs: 0, runTo: 3 }),
  updateMatchLegs: jest.fn().mockResolvedValue({}),
  refreshMatchLiveState: jest.fn().mockResolvedValue(undefined),
  findLastThrow: jest.fn().mockResolvedValue({ id: 'throw1', playerId: 'p1' }),
  findPreviousLegLastThrow: jest.fn().mockResolvedValue(null),
  decrementMatchLegs: jest.fn().mockResolvedValue({}),
  markPlayerThrowUndone: jest.fn().mockResolvedValue(undefined),
  findRedoableThrow: jest.fn().mockResolvedValue(null),
  restorePlayerThrow: jest.fn().mockResolvedValue({ checkout: false }),
}))

jest.mock('@/app/lib/cuescore', () => ({
  getCueScoreGateway: jest.fn(),
  setScore: jest.fn(),
}))

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}))

jest.mock('@/app/lib/match-live-state', () => ({
  refreshMatchLiveState: jest.fn(),
  findMatchLiveStates: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

describe('Dashboard caching - playerThrow invalidation', () => {
  const revalidateTag = (jest.requireMock('next/cache') as Record<string, jest.Mock>).revalidateTag

  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.$transaction as unknown as jest.Mock).mockImplementation(async (fn) => {
      return await fn({} as never)
    })
  })

  test('recordThrow invalidates cache for correct table', async () => {
    const { recordThrow } = jest.requireActual('@/app/tournaments/[id]/tables/[table]/actions')

    await recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 1, playerId: 'p1', score: 60, dartsCount: 3, table: '2' })

    expect(revalidateTag).toHaveBeenCalledWith('match2', 'max')
  })

  test('undoLastThrow invalidates cache for correct table', async () => {
    const { undoLastThrow } = jest.requireActual('@/app/tournaments/[id]/tables/[table]/actions')

    await undoLastThrow({ matchId: 'm1', leg: 1, table: '4' })

    expect(revalidateTag).toHaveBeenCalledWith('match4', 'max')
  })

  test('redoThrow invalidates cache for correct table', async () => {
    const { redoThrow } = jest.requireActual('@/app/tournaments/[id]/tables/[table]/actions')

    await redoThrow({ matchId: 'm1', leg: 1, table: '5' })

    expect(revalidateTag).toHaveBeenCalledWith('match5', 'max')
  })
})
