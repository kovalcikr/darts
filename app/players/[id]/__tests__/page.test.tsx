import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import PlayerDetailPage from '../page'
import prisma from '@/app/lib/db'
import { getPlayers } from '@/app/lib/players'
import { getTournaments } from '@/app/lib/tournament'
import type { PrismaClient } from '@/prisma/client'
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('@/app/lib/players', () => ({
  getPlayers: jest.fn(),
}))

jest.mock('@/app/lib/tournament', () => ({
  getTournaments: jest.fn(),
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

describe('player detail page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
  })

  test('renders stable fallback stats when a ranked player has no local match data yet', async () => {
    jest.mocked(getTournaments).mockResolvedValue([] as never)
    jest.mocked(getPlayers).mockResolvedValue({} as never)

    prismaMock.match.findMany.mockResolvedValue([] as never)
    prismaMock.playerThrow.aggregate.mockResolvedValue({
      _count: { id: 0 },
      _sum: { score: null, darts: null },
      _max: { score: null },
    } as never)
    prismaMock.playerThrow.groupBy.mockResolvedValue([] as never)
    prismaMock.playerThrow.findMany.mockResolvedValue([] as never)

    const element = await PlayerDetailPage({
      params: Promise.resolve({ id: 'ranked-player-42' }),
      searchParams: Promise.resolve({ season: '2026' }),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('data-season="2026"')
    expect(html).toContain('ranked-player-42')
    expect(html).toContain('0 / 0 (0.0%)')
    expect(html).toContain('>0.00<')
    expect(html).toContain('>0<')
    expect(html).not.toContain('undefined')
    expect(html).not.toContain('NaN')
    expect(html).not.toContain('Infinity')
  })
})
