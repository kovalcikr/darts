import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { renderToStaticMarkup } from 'react-dom/server'
import prisma from '@/app/lib/db'
import AdminPage from '../page'
import * as auth from '../auth'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('../auth', () => ({
  ADMIN_PASSWORD_ENV: 'ADMIN_UI_PASSWORD',
  ADMIN_USERNAME_ENV: 'ADMIN_UI_USERNAME',
  isAdminAuthenticated: jest.fn(),
  isAdminConfigured: jest.fn(),
}))

jest.mock('../actions', () => ({
  deleteMatchAction: jest.fn(),
  deleteThrowAction: jest.fn(),
  deleteTournamentAction: jest.fn(),
  loginAdminAction: jest.fn(),
  logoutAdminAction: jest.fn(),
  toggleTournamentGlobalStatsAction: jest.fn(),
  updateMatchAction: jest.fn(),
  updateThrowAction: jest.fn(),
  updateTournamentAction: jest.fn(),
}))

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('admin page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
  })

  test('renders login view when unauthenticated', async () => {
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(false)
    jest.mocked(auth.isAdminConfigured).mockReturnValue(true)

    const element = await AdminPage({
      searchParams: Promise.resolve({}),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Darts control room')
    expect(html).toContain('Login')
    expect(html).toContain('ADMIN_UI_USERNAME')
    expect(html).toContain('ADMIN_UI_PASSWORD')
  })

  test('renders tournaments only when authenticated', async () => {
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(true)
    jest.mocked(auth.isAdminConfigured).mockReturnValue(true)

    prismaMock.tournament.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Relax Darts CUP 01 2026',
        season: 2026,
        eventDate: new Date('2026-04-23T00:00:00.000Z'),
        includeInGlobalStats: false,
        _count: { matches: 2 },
      },
    ] as never)
    prismaMock.playerThrow.groupBy.mockResolvedValue([
      {
        tournamentId: 't1',
        _count: { id: 8 },
      },
    ] as never)

    const element = await AdminPage({
      searchParams: Promise.resolve({
        q: 'Relax',
        notice: 'Saved',
      }),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Relax Darts CUP 01 2026')
    expect(html).toContain('Season: 2026')
    expect(html).toContain('Date:')
    expect(html).toContain('Excluded from global stats')
    expect(html).toContain('Include to stats')
    expect(html).toContain('View Matches')
    expect(html).toContain('Delete Tournament')
    expect(html).toContain('Saved')
    expect(html).toContain('Relax')
    expect(html).not.toContain('Alice vs Bob')
    expect(html).not.toContain('140 points')
  })
})
