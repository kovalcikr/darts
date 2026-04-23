import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@prisma/client'
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import prisma from '@/app/lib/db'
import {
  createThrowAction,
  deleteMatchAction,
  deleteThrowAction,
  deleteTournamentAction,
  loginAdminAction,
  logoutAdminAction,
  updateMatchAction,
  updateThrowAction,
  updateTournamentAction,
} from '../actions'
import * as auth from '../auth'

const mockRedirect = jest.fn<(url: string) => never>()
const mockRevalidatePath = jest.fn()
const mockCookies = jest.fn()

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args as [string]),
}))

jest.mock('next/headers', () => ({
  cookies: (...args: unknown[]) => mockCookies(...args),
}))

jest.mock('../auth', () => ({
  ADMIN_PASSWORD_ENV: 'ADMIN_UI_PASSWORD',
  ADMIN_SESSION_COOKIE: 'darts-admin-session',
  ADMIN_USERNAME_ENV: 'ADMIN_UI_USERNAME',
  getAdminSessionToken: jest.fn(),
  isAdminAuthenticated: jest.fn(),
  isAdminConfigured: jest.fn(),
  validateAdminCredentials: jest.fn(),
}))

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

function buildFormData(values: Record<string, string>) {
  const formData = new FormData()

  for (const [key, value] of Object.entries(values)) {
    formData.append(key, value)
  }

  return formData
}

function createRedirectError(url: string) {
  return Object.assign(new Error(`redirect:${url}`), { url })
}

function mockCallbackTransaction() {
  prismaMock.$transaction.mockImplementation(async (input: unknown) => {
    if (typeof input === 'function') {
      return input(prismaMock as never)
    }

    return input as never
  })
}

async function expectRedirect(action: () => Promise<unknown>, expectedUrl: string) {
  await expect(action()).rejects.toMatchObject({ url: expectedUrl })
}

describe('admin actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)

    mockRedirect.mockImplementation((url: string) => {
      throw createRedirectError(url)
    })

    jest.mocked(auth.getAdminSessionToken).mockReturnValue('session-token')
    jest.mocked(auth.isAdminAuthenticated).mockResolvedValue(true)
    jest.mocked(auth.isAdminConfigured).mockReturnValue(true)
    jest.mocked(auth.validateAdminCredentials).mockReturnValue(true)
  })

  test('logs in and stores admin cookie', async () => {
    const set = jest.fn()
    mockCookies.mockResolvedValue({ set, delete: jest.fn(), get: jest.fn() })

    const formData = buildFormData({
      username: 'admin',
      password: 'secret',
      returnTo: '/admin?q=7295',
    })

    await expectRedirect(() => loginAdminAction(formData), '/admin?q=7295&notice=Logged+in.')

    expect(auth.validateAdminCredentials).toHaveBeenCalledWith('admin', 'secret')
    expect(set).toHaveBeenCalledWith(
      'darts-admin-session',
      'session-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    )
  })

  test('rejects invalid login', async () => {
    mockCookies.mockResolvedValue({ set: jest.fn(), delete: jest.fn(), get: jest.fn() })
    jest.mocked(auth.validateAdminCredentials).mockReturnValue(false)

    const formData = buildFormData({
      username: 'admin',
      password: 'wrong',
      returnTo: '/admin',
    })

    await expectRedirect(
      () => loginAdminAction(formData),
      '/admin?error=Invalid+admin+username+or+password.'
    )
  })

  test('logs out and clears admin cookie', async () => {
    const del = jest.fn()
    mockCookies.mockResolvedValue({ set: jest.fn(), delete: del, get: jest.fn() })

    const formData = buildFormData({
      returnTo: '/admin?q=final',
    })

    await expectRedirect(() => logoutAdminAction(formData), '/admin?q=final&notice=Logged+out.')

    expect(del).toHaveBeenCalledWith('darts-admin-session')
  })

  test('updates tournament and revalidates related pages', async () => {
    prismaMock.tournament.update.mockResolvedValue({ id: 't1', name: 'Updated Cup' } as never)

    const formData = buildFormData({
      id: 't1',
      name: 'Updated Cup',
      returnTo: '/admin?q=t1',
    })

    await expectRedirect(() => updateTournamentAction(formData), '/admin?q=t1&notice=Tournament+updated.')

    expect(prismaMock.tournament.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { name: 'Updated Cup' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tournaments/t1')
  })

  test('deletes tournament with dependent records in a transaction', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1' } as never)
    prismaMock.playerThrow.deleteMany.mockResolvedValue({ count: 3 } as never)
    prismaMock.match.deleteMany.mockResolvedValue({ count: 2 } as never)
    prismaMock.tournament.delete.mockResolvedValue({ id: 't1', name: 'Cup' } as never)
    prismaMock.$transaction.mockResolvedValue([] as never)

    const formData = buildFormData({
      id: 't1',
      returnTo: '/admin',
    })

    await expectRedirect(() => deleteTournamentAction(formData), '/admin?notice=Tournament+deleted.')

    expect(prismaMock.$transaction).toHaveBeenCalledWith([
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ])
    expect(prismaMock.playerThrow.deleteMany).toHaveBeenCalledWith({
      where: { tournamentId: 't1' },
    })
    expect(prismaMock.match.deleteMany).toHaveBeenCalledWith({
      where: { tournamentId: 't1' },
    })
    expect(prismaMock.tournament.delete).toHaveBeenCalledWith({
      where: { id: 't1' },
    })
  })

  test('updates match and revalidates old and new tournament pages', async () => {
    prismaMock.match.findUnique.mockResolvedValue({ tournamentId: 't1' } as never)
    prismaMock.match.update.mockResolvedValue({ id: 'm1', tournamentId: 't2' } as never)

    const formData = buildFormData({
      id: 'm1',
      tournamentId: 't2',
      round: 'Final',
      playerAId: 'p1',
      playerAName: 'Alpha',
      playerAImage: 'a.jpg',
      playerBId: 'p2',
      playerBName: 'Beta',
      playerBImage: 'b.jpg',
      runTo: '7',
      playerALegs: '4',
      playerBlegs: '2',
      firstPlayer: 'p1',
      returnTo: '/admin?q=m1',
    })

    await expectRedirect(() => updateMatchAction(formData), '/admin?q=m1&notice=Match+updated.')

    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: expect.objectContaining({
        tournamentId: 't2',
        round: 'Final',
        runTo: 7,
        playerALegs: 4,
        playerBlegs: 2,
        firstPlayer: 'p1',
      }),
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tournaments/t1')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/tournaments/t2')
  })

  test('deletes match', async () => {
    prismaMock.match.findUnique.mockResolvedValue({ tournamentId: 't1' } as never)
    prismaMock.match.delete.mockResolvedValue({ id: 'm1' } as never)

    const formData = buildFormData({
      id: 'm1',
      returnTo: '/admin',
    })

    await expectRedirect(() => deleteMatchAction(formData), '/admin?notice=Match+deleted.')

    expect(prismaMock.match.delete).toHaveBeenCalledWith({ where: { id: 'm1' } })
  })

  test('updates throw with parsed numeric and date fields', async () => {
    prismaMock.playerThrow.findUnique.mockResolvedValue({ tournamentId: 't1' } as never)
    prismaMock.playerThrow.update.mockResolvedValue({ id: 'pt1', tournamentId: 't2', matchId: 'm2' } as never)

    const formData = buildFormData({
      id: 'pt1',
      tournamentId: 't2',
      matchId: 'm2',
      leg: '3',
      playerId: 'p2',
      time: '2026-04-23T12:34:56.000Z',
      score: '140',
      darts: '2',
      doubles: '1',
      returnTo: '/admin?q=pt1',
    })
    formData.append('checkout', 'on')

    await expectRedirect(() => updateThrowAction(formData), '/admin?q=pt1&notice=Throw+updated.')

    expect(prismaMock.playerThrow.update).toHaveBeenCalledWith({
      where: { id: 'pt1' },
      data: expect.objectContaining({
        tournamentId: 't2',
        matchId: 'm2',
        leg: 3,
        score: 140,
        darts: 2,
        doubles: 1,
        checkout: true,
        time: new Date('2026-04-23T12:34:56.000Z'),
      }),
    })
  })

  test('inserts a throw at the end of a leg', async () => {
    mockCallbackTransaction()
    prismaMock.playerThrow.findMany.mockResolvedValue([
      {
        id: 'pt1',
        time: new Date('2026-04-23T12:34:56.000Z'),
      },
    ] as never)
    prismaMock.playerThrow.create.mockResolvedValue({ id: 'pt2' } as never)

    const formData = buildFormData({
      tournamentId: 't1',
      matchId: 'm1',
      leg: '1',
      playerId: 'p2',
      score: '100',
      darts: '3',
      returnTo: '/admin/matches/m1',
    })

    await expectRedirect(
      () => createThrowAction(formData),
      '/admin/matches/m1?notice=Throw+inserted.'
    )

    expect(prismaMock.playerThrow.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tournamentId: 't1',
        matchId: 'm1',
        leg: 1,
        playerId: 'p2',
        score: 100,
        darts: 3,
        doubles: null,
        checkout: false,
        time: new Date('2026-04-23T12:34:57.000Z'),
      }),
    })
  })

  test('deletes throw', async () => {
    prismaMock.playerThrow.findUnique.mockResolvedValue({ tournamentId: 't1', matchId: 'm1' } as never)
    prismaMock.playerThrow.delete.mockResolvedValue({ id: 'pt1' } as never)

    const formData = buildFormData({
      id: 'pt1',
      returnTo: '/admin',
    })

    await expectRedirect(() => deleteThrowAction(formData), '/admin?notice=Throw+deleted.')

    expect(prismaMock.playerThrow.delete).toHaveBeenCalledWith({ where: { id: 'pt1' } })
  })
})
