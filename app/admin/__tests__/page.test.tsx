import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { renderToStaticMarkup } from 'react-dom/server'
import prisma from '@/app/lib/db'
import AdminPage from '../page'
import { getActiveTournament } from '@/app/lib/active-tournament'
import * as auth from '../auth'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('../auth', () => ({
  ADMIN_PASSWORD_ENV: 'ADMIN_UI_PASSWORD',
  ADMIN_USERNAME_ENV: 'ADMIN_UI_USERNAME',
  isAdminAuthenticated: jest.fn(),
  isAdminConfigured: jest.fn(),
}))

jest.mock('../actions', () => ({
  clearActiveTournamentAction: jest.fn(),
  createActiveTournamentAction: jest.fn(),
  deleteMatchAction: jest.fn(),
  deleteThrowAction: jest.fn(),
  deleteTournamentAction: jest.fn(),
  loginAdminAction: jest.fn(),
  logoutAdminAction: jest.fn(),
  restoreTournamentAction: jest.fn(),
  setActiveTournamentAction: jest.fn(),
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
    jest.mocked(getActiveTournament).mockResolvedValue(null)
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
    prismaMock.tournamentAudit.findMany.mockResolvedValue([] as never)
    jest.mocked(getActiveTournament).mockResolvedValue({
      id: 't1',
      name: 'Relax Darts CUP 01 2026',
      season: 2026,
      eventDate: new Date('2026-04-23T00:00:00.000Z'),
      includeInGlobalStats: false,
    } as never)

    const element = await AdminPage({
      searchParams: Promise.resolve({
        q: 'Relax',
        notice: 'Saved',
      }),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Relax Darts CUP 01 2026')
    expect(html).toContain('Active Tournament')
    expect(html).toContain('Create and Set Active')
    expect(html).toContain('Clear Active')
    expect(html).toContain('href="/tables"')
    expect(html).not.toContain('href="/tournaments/t1"')
    expect(html).toContain('Season: 2026')
    expect(html).toContain('Date:')
    expect(html).toContain('Excluded from global stats')
    expect(html).toContain('Include to stats')
    expect(html).toContain('View Matches')
    expect(html).toContain('Active')
    expect(html).toContain('Delete Tournament')
    expect(html).toContain('Saved')
    expect(html).toContain('Relax')
    expect(html).not.toContain('Alice vs Bob')
    expect(html).not.toContain('140 points')
  })

  test('View Deleted Tournaments link appears before Log out button', async () => {
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(true)
    jest.mocked(auth.isAdminConfigured).mockReturnValue(true)

    prismaMock.tournament.findMany.mockResolvedValue([])
    prismaMock.playerThrow.groupBy.mockResolvedValue([])
    prismaMock.tournamentAudit.findMany.mockResolvedValue([])
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await AdminPage({
      searchParams: Promise.resolve({}),
    })

    const html = renderToStaticMarkup(element)

    const viewDeletedIndex = html.indexOf('View Deleted Tournaments')
    const logOutIndex = html.indexOf('Log out')

    expect(viewDeletedIndex).toBeGreaterThan(-1)
    expect(logOutIndex).toBeGreaterThan(-1)
    expect(viewDeletedIndex).toBeLessThan(logOutIndex)
  })

  test('shows Delete Tournament button for restored tournaments without audit records', async () => {
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(true)
    jest.mocked(auth.isAdminConfigured).mockReturnValue(true)

    prismaMock.tournament.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Restored Tournament',
        season: 2026,
        eventDate: new Date('2026-04-23T00:00:00.000Z'),
        includeInGlobalStats: false,
        _count: { matches: 1 },
      },
    ] as never)
    prismaMock.playerThrow.groupBy.mockResolvedValue([])
    prismaMock.tournamentAudit.findMany.mockResolvedValue([] as never)
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await AdminPage({
      searchParams: Promise.resolve({}),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Restored Tournament')
    expect(html).toContain('Delete Tournament')
    expect(html).not.toContain('Restore Tournament')
  })

  test('shows Restore Tournament button for tournaments with audit records', async () => {
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(true)
    jest.mocked(auth.isAdminConfigured).mockReturnValue(true)

    prismaMock.tournament.findMany.mockResolvedValue([
      {
        id: 't1',
        name: 'Deleted Tournament',
        season: 2026,
        eventDate: new Date('2026-04-23T00:00:00.000Z'),
        includeInGlobalStats: false,
        _count: { matches: 1 },
      },
    ] as never)
    prismaMock.playerThrow.groupBy.mockResolvedValue([])
    prismaMock.tournamentAudit.findMany.mockResolvedValue([
      { tournamentId: 't1' },
    ] as never)
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await AdminPage({
      searchParams: Promise.resolve({}),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Deleted Tournament')
    expect(html).toContain('Restore Tournament')
    expect(html).not.toContain('Delete Tournament')
  })
})
