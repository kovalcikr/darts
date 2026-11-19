import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { prismaMock } from '@/app/__tests__/mocks'
import { getPlayers } from '@/app/lib/players'
import { findTournamentIdsBySeason } from '@/app/lib/data/tournament-queries'
import { getSeasonStats, invalidateSeasonStats } from '@/app/lib/season-stats'

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
}))

jest.mock('@/app/lib/data/tournament-queries', () => ({
  findTournamentIdsBySeason: jest.fn(),
}))

jest.mock('@/app/lib/players', () => ({
  getPlayers: jest.fn(),
}))

const nextCache = jest.requireMock('next/cache') as {
  unstable_cache: jest.Mock
  revalidateTag: jest.Mock
}

const matchAggregate = prismaMock.match.aggregate as unknown as jest.Mock
const playerThrowAggregate = prismaMock.playerThrow.aggregate as unknown as jest.Mock

const [cacheCall] = nextCache.unstable_cache.mock.calls as Array<
  [unknown, string[], { tags?: string[]; revalidate?: number }]
>
const cacheKeyParts = cacheCall?.[1]
const cacheOptions = cacheCall?.[2]

describe('season stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('derives the season stats shape from the cached queries', async () => {
    jest.mocked(findTournamentIdsBySeason).mockResolvedValue(['t1'])
    jest.mocked(getPlayers).mockResolvedValue({ p1: 'Alice', p2: 'Bob' })

    matchAggregate.mockResolvedValue({
      _count: { id: 2 },
      _sum: { playerALegs: 3, playerBlegs: 2 },
    } as never)

    playerThrowAggregate
      .mockResolvedValueOnce({ _count: { id: 5 } } as never)
      .mockResolvedValueOnce({ _count: { id: 4 } } as never)
      .mockResolvedValueOnce({ _count: { id: 100 }, _sum: { score: 1900, darts: 250 } } as never)

    prismaMock.playerThrow.groupBy
      .mockResolvedValueOnce([
        { playerId: 'p1', _sum: { score: 600, darts: 300 } },
        { playerId: 'p2', _sum: { score: 400, darts: 100 } },
        { playerId: 'p3', _sum: { score: 900, darts: 300 } },
      ] as never)
      .mockResolvedValueOnce([
        { playerId: 'p1', _sum: { score: 501, darts: 12 } },
        { playerId: 'p2', _sum: { score: 501, darts: 12 } },
        { playerId: 'p1', _sum: { score: 501, darts: 15 } },
      ] as never)

    prismaMock.playerThrow.findFirst.mockResolvedValue({ playerId: 'p1', score: 170 } as never)
    prismaMock.playerThrow.findMany.mockResolvedValue([
      { playerId: 'p1', score: 170 },
      { playerId: 'p1', score: 170 },
      { playerId: 'p2', score: 170 },
    ] as never)

    const stats = await getSeasonStats('2026')

    expect(findTournamentIdsBySeason).toHaveBeenCalledWith('2026')
    expect(stats).toEqual({
      season: '2026',
      playerCount: 2,
      tournamentCount: 1,
      matchCount: 2,
      legCount: 5,
      throwCount: 100,
      dartCount: 250,
      count180: 5,
      count171Plus: 4,
      bestAverage: { threeDartAverage: 12, playerIds: ['p2'] },
      bestCheckout: { score: 170, playerIds: ['p1', 'p2'] },
      bestLeg: { darts: 12, playerIds: ['p1', 'p2'] },
      playerNames: { p1: 'Alice', p2: 'Bob' },
    })
  })

  test('drops players missing from playerNames before ranking averages', async () => {
    jest.mocked(findTournamentIdsBySeason).mockResolvedValue(['t1'])
    jest.mocked(getPlayers).mockResolvedValue({ p1: 'Alice' })

    matchAggregate.mockResolvedValue({
      _count: { id: 1 },
      _sum: { playerALegs: 1, playerBlegs: 0 },
    } as never)
    playerThrowAggregate
      .mockResolvedValueOnce({ _count: { id: 0 } } as never)
      .mockResolvedValueOnce({ _count: { id: 0 } } as never)
      .mockResolvedValueOnce({ _count: { id: 9 }, _sum: { score: 300, darts: 100 } } as never)
    prismaMock.playerThrow.groupBy
      .mockResolvedValueOnce([
        { playerId: 'p1', _sum: { score: 100, darts: 100 } },
        { playerId: 'p2', _sum: { score: 200, darts: 50 } },
      ] as never)
      .mockResolvedValueOnce([] as never)
    prismaMock.playerThrow.findFirst.mockResolvedValue(null as never)

    const stats = await getSeasonStats('2026')

    expect(stats.bestAverage).toEqual({ threeDartAverage: 3, playerIds: ['p1'] })
    expect(stats.bestLeg).toBeNull()
    expect(stats.bestCheckout).toBeNull()
  })

  test('keeps every checkout with the top score, deduped by player', async () => {
    jest.mocked(findTournamentIdsBySeason).mockResolvedValue(['t1'])
    jest.mocked(getPlayers).mockResolvedValue({})
    matchAggregate.mockResolvedValue({
      _count: { id: 0 },
      _sum: { playerALegs: null, playerBlegs: null },
    } as never)
    playerThrowAggregate
      .mockResolvedValueOnce({ _count: { id: 0 } } as never)
      .mockResolvedValueOnce({ _count: { id: 0 } } as never)
      .mockResolvedValueOnce({ _count: { id: 0 }, _sum: { score: null, darts: null } } as never)
    prismaMock.playerThrow.groupBy
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
    prismaMock.playerThrow.findFirst.mockResolvedValue({ playerId: 'p9', score: 161 } as never)
    prismaMock.playerThrow.findMany.mockResolvedValue([
      { playerId: 'p9', score: 161 },
      { playerId: 'p8', score: 161 },
      { playerId: 'p9', score: 161 },
    ] as never)

    const stats = await getSeasonStats('2026')

    expect(prismaMock.playerThrow.findFirst).toHaveBeenCalledWith({
      where: { checkout: true, tournamentId: { in: ['t1'] }, undoneAt: null },
      orderBy: { score: 'desc' },
      select: { score: true },
    })
    expect(prismaMock.playerThrow.findMany).toHaveBeenCalledWith({
      where: { checkout: true, tournamentId: { in: ['t1'] }, undoneAt: null, score: 161 },
      select: { playerId: true, score: true },
    })
    expect(stats.bestCheckout).toEqual({ score: 161, playerIds: ['p9', 'p8'] })
  })

  test('returns an empty season shape when there are no rows', async () => {
    jest.mocked(findTournamentIdsBySeason).mockResolvedValue([])
    jest.mocked(getPlayers).mockResolvedValue({})
    matchAggregate.mockResolvedValue({
      _count: { id: 0 },
      _sum: { playerALegs: null, playerBlegs: null },
    } as never)
    playerThrowAggregate
      .mockResolvedValueOnce({ _count: { id: 0 } } as never)
      .mockResolvedValueOnce({ _count: { id: 0 } } as never)
      .mockResolvedValueOnce({ _count: { id: 0 }, _sum: { score: null, darts: null } } as never)
    prismaMock.playerThrow.groupBy
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
    prismaMock.playerThrow.findFirst.mockResolvedValue(null as never)

    const stats = await getSeasonStats('2031')

    expect(stats).toEqual({
      season: '2031',
      playerCount: 0,
      tournamentCount: 0,
      matchCount: 0,
      legCount: 0,
      throwCount: 0,
      dartCount: null,
      count180: 0,
      count171Plus: 0,
      bestAverage: null,
      bestCheckout: null,
      bestLeg: null,
      playerNames: {},
    })
    expect(prismaMock.playerThrow.findMany).not.toHaveBeenCalled()
  })

  test('registers the cache key parts, tag, and revalidate window', () => {
    expect(cacheKeyParts).toEqual(['season-stats'])
    expect(cacheOptions?.tags).toContain('season-stats')
    expect(cacheOptions?.revalidate).toBe(300)
  })

  test('invalidateSeasonStats expires the season stats tag', () => {
    invalidateSeasonStats()

    expect(nextCache.revalidateTag).toHaveBeenCalledWith('season-stats', { expire: 0 })
  })
})
