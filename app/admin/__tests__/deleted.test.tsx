import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import { renderToStaticMarkup } from 'react-dom/server'
import prisma from '@/app/lib/db'
import AdminDeletedTournamentsPage from '../deleted/page'
import { isAdminAuthenticated } from '../auth'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('../auth', () => ({
  isAdminAuthenticated: jest.fn(),
}))

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('admin deleted tournaments page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
    jest.mocked(isAdminAuthenticated).mockResolvedValue(true)
  })

  test('renders empty state when no deleted tournaments', async () => {
    prismaMock.tournamentAudit.findMany.mockResolvedValue([] as never)

    const element = await AdminDeletedTournamentsPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Deleted Tournaments')
    expect(html).toContain('No deleted tournaments found')
    expect(html).toContain('Back to Tournaments')
  })

  test('renders deleted tournaments with restore button', async () => {
    prismaMock.tournamentAudit.findMany.mockResolvedValue([
      {
        id: 'audit1',
        tournamentId: 't1',
        name: 'Relax Darts CUP 01 2026',
        season: 2026,
        eventDate: new Date('2026-04-23T00:00:00.000Z'),
        includeInGlobalStats: false,
        deletedAt: new Date('2026-04-24T12:00:00.000Z'),
        deletedBy: 'admin',
      },
    ] as never)

    const element = await AdminDeletedTournamentsPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Relax Darts CUP 01 2026')
    expect(html).toContain('Season: 2026')
    expect(html).toContain('Restore Tournament')
    expect(html).toContain('Deleted:')
  })
})