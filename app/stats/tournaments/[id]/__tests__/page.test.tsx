import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import TournamentStatsPage from '../page'
import prisma from '@/app/lib/db'
import { getResults } from '@/app/lib/cuescore'
import { getPlayers } from '@/app/lib/players'
import { getTournamentStatsSnapshot } from '@/app/lib/tournament-stats'
import type { PrismaClient } from '@/prisma/client'
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('@/app/lib/cuescore', () => ({
  getResults: jest.fn(),
}))

jest.mock('@/app/lib/players', () => ({
  getPlayers: jest.fn(),
}))

jest.mock('@/app/lib/tournament-stats', () => ({
  getTournamentStatsSnapshot: jest.fn(),
}))

jest.mock('@/app/components/StatsPageShell', () => ({
  __esModule: true,
  default: ({ children, season, title }: { children: ReactNode; season?: string; title?: ReactNode }) => (
    <div data-season={season}>
      <div>{title}</div>
      {children}
    </div>
  ),
}))

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('tournament stats page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
  })

  test('renders local stats even when the tournament is excluded from global stats', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({
      id: 't1',
      name: 'Excluded Cup',
      includeInGlobalStats: false,
    } as never)

    jest.mocked(getResults).mockResolvedValue({ tournamentId: 't1' } as never)
    jest.mocked(getPlayers).mockResolvedValue({
      p1: 'Alice',
    } as never)
    jest.mocked(getTournamentStatsSnapshot).mockResolvedValue({
      matches: [],
      highScore: [{ player: 'p1', s180: 1, s170: 0, s80: 0, s100: 0, s133: 0, b170: [] }],
      bestCheckout: [{ playerId: 'p1', score: 120, _sum: { darts: 9, score: 360 } }],
      bestCoc: [],
      bLeg: [],
      bestLegDarts: 0,
      bLegPlayers: {},
      bestAvg: [{ playerId: 'p1', _sum: { score: 360, darts: 12 } }],
      avgPP: [],
    } as never)

    const element = await TournamentStatsPage({
      params: Promise.resolve({ id: 't1' }),
      searchParams: Promise.resolve({ season: '2026' }),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('data-season="2026"')
    expect(html).toContain('Excluded Cup')
    expect(html).toContain('Najlepší checkout')
    expect(html).toContain('Najlepší priemer')
  })
})
