import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import { renderToStaticMarkup } from 'react-dom/server'
import prisma from '@/app/lib/db'
import AdminMatchPage from '../matches/[id]/page'
import AdminTournamentPage from '../tournaments/[id]/page'
import * as auth from '../auth'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('../auth', () => ({
  isAdminAuthenticated: jest.fn(),
}))

jest.mock('../actions', () => ({
  createThrowAction: jest.fn(),
  deleteMatchAction: jest.fn(),
  deleteThrowAction: jest.fn(),
  deleteTournamentAction: jest.fn(),
  toggleTournamentGlobalStatsAction: jest.fn(),
  updateMatchAction: jest.fn(),
  updateThrowAction: jest.fn(),
  updateTournamentAction: jest.fn(),
}))

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('admin detail pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(true)
  })

  test('renders tournament detail with matches only', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({
      id: 't1',
      name: 'Relax Darts CUP 01 2026',
      season: 2026,
      eventDate: new Date('2026-04-23T00:00:00.000Z'),
      includeInGlobalStats: false,
      _count: { matches: 2 },
    } as never)
    prismaMock.match.findMany.mockResolvedValue([
      {
        id: 'm1',
        round: 'Final',
        tournamentId: 't1',
        playerAId: 'p1',
        playerAName: 'Alice',
        playerAImage: 'alice.jpg',
        playerBId: 'p2',
        playerBName: 'Bob',
        playerBImage: 'bob.jpg',
        runTo: 5,
        playerALegs: 3,
        playerBlegs: 1,
        firstPlayer: 'p1',
        _count: { throwsList: 9 },
      },
    ] as never)

    const element = await AdminTournamentPage({
      params: Promise.resolve({ id: 't1' }),
      searchParams: Promise.resolve({}),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Relax Darts CUP 01 2026')
    expect(html).toContain('Season: 2026')
    expect(html).toContain('Date:')
    expect(html).toContain('Excluded from global stats')
    expect(html).toContain('Include to stats')
    expect(html).toContain('Alice vs Bob')
    expect(html).toContain('View Throws')
    expect(html).not.toContain('140 points')
  })

  test('renders match detail leg by leg with insert controls', async () => {
    prismaMock.match.findUnique.mockResolvedValue({
      id: 'm1',
      round: 'Final',
      tournamentId: 't1',
      tournament: { id: 't1', name: 'Relax Darts CUP 01 2026' },
      playerAId: 'p1',
      playerAName: 'Alice',
      playerAImage: 'alice.jpg',
      playerBId: 'p2',
      playerBName: 'Bob',
      playerBImage: 'bob.jpg',
      runTo: 5,
      playerALegs: 3,
      playerBlegs: 1,
      firstPlayer: 'p1',
    } as never)
    prismaMock.playerThrow.findMany.mockResolvedValue([
      {
        id: 'pt1',
        tournamentId: 't1',
        matchId: 'm1',
        leg: 1,
        playerId: 'p1',
        time: new Date('2026-04-23T12:34:56.000Z'),
        score: 140,
        darts: 3,
        doubles: null,
        checkout: false,
      },
      {
        id: 'pt2',
        tournamentId: 't1',
        matchId: 'm1',
        leg: 1,
        playerId: 'p2',
        time: new Date('2026-04-23T12:35:56.000Z'),
        score: 100,
        darts: 3,
        doubles: null,
        checkout: false,
      },
    ] as never)

    const element = await AdminMatchPage({
      params: Promise.resolve({ id: 'm1' }),
      searchParams: Promise.resolve({}),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Alice vs Bob')
    expect(html).toContain('Leg 1')
    expect(html).toContain('Visit 1')
    expect(html).toContain('Insert Before')
    expect(html).toContain('Insert At Leg Start')
    expect(html).toContain('Start another leg')
    expect(html).toContain('Delete Throw')
    expect(html).not.toContain('View Matches')
  })
})
