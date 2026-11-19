import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { prismaMock } from '@/app/__tests__/mocks'
import { findTournamentIdsBySeason } from '../tournament-queries'

describe('findTournamentIdsBySeason', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('maps tournaments for the parsed season to ids', async () => {
    prismaMock.tournament.findMany.mockResolvedValue([
      { id: 't1', name: 'Cup 1 2026' },
      { id: 't2', name: 'Cup 2 2026' },
    ] as never)

    const ids = await findTournamentIdsBySeason('2026')

    expect(ids).toEqual(['t1', 't2'])
    expect(prismaMock.tournament.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { includeInGlobalStats: true },
            {
              OR: [
                { season: 2026 },
                { season: null, name: { contains: '2026' } },
              ],
            },
          ],
        },
      })
    )
  })

  test('returns an empty list without querying for a non-year input', async () => {
    const ids = await findTournamentIdsBySeason('not-a-year')

    expect(ids).toEqual([])
    expect(prismaMock.tournament.findMany).not.toHaveBeenCalled()
  })
})
