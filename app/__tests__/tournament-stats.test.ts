import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import prisma from '../lib/db'
import { getTournamentStatsSnapshot } from '../lib/tournament-stats'

jest.mock('../lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('tournament stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
  })

  test('builds completed-match stats with a stable tournament filter', async () => {
    prismaMock.match.findMany.mockResolvedValue([
      { id: 'm-complete', isComplete: true },
      { id: 'm-live', isComplete: false },
    ] as never)
    prismaMock.playerThrow.findMany
      .mockResolvedValueOnce([
        { playerId: 'p1', score: 180 },
        { playerId: 'p2', score: 171 },
      ] as never)
      .mockResolvedValueOnce([
        { playerId: 'p1', score: 120 },
        { playerId: 'p2', score: 80 },
      ] as never)
    prismaMock.playerThrow.groupBy
      .mockResolvedValueOnce([
        { playerId: 'p1', _sum: { score: 501, darts: 15 } },
        { playerId: 'p2', _sum: { score: 501, darts: 18 } },
      ] as never)
      .mockResolvedValueOnce([
        { matchId: 'm-complete', playerId: 'p1', _sum: { score: 180, darts: 9 } },
        { matchId: 'm-complete', playerId: 'p2', _sum: { score: 150, darts: 9 } },
      ] as never)

    const stats = await getTournamentStatsSnapshot('t1')

    expect(prismaMock.match.findMany).toHaveBeenCalledWith({
      where: {
        tournamentId: 't1',
      },
    })
    expect(prismaMock.playerThrow.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          tournamentId: 't1',
          match: {
            is: {
              isComplete: true,
            },
          },
        }),
      })
    )
    expect(prismaMock.playerThrow.groupBy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          tournamentId: 't1',
          match: {
            is: {
              isComplete: true,
            },
          },
        },
      })
    )
    expect(stats.matches).toHaveLength(2)
    expect(stats.highScore[0].player).toBe('p1')
    expect(stats.bestCheckout[0].score).toBe(120)
    expect(stats.bestLegDarts).toBe(15)
    expect(stats.bestAvg[0].playerId).toBe('p1')
    expect(stats.avgPP[0].player).toBe('p1')
  })
})
