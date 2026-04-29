import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import prisma from '@/app/lib/db'
import {
  ACTIVE_TOURNAMENT_SETTING_KEY,
  clearActiveTournament,
  clearActiveTournamentIfMatches,
  getActiveTournament,
  getActiveTournamentId,
  setActiveTournament,
} from '../lib/active-tournament'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

const prismaMock = prisma as any

function mockResolved(fn: unknown, value: unknown) {
  ;(fn as { mockResolvedValue: (mockValue: unknown) => void }).mockResolvedValue(value)
}

describe('active tournament settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
  })

  test('reads the active tournament id from app settings', async () => {
    mockResolved(prismaMock.appSetting.findUnique, {
      key: ACTIVE_TOURNAMENT_SETTING_KEY,
      value: 't1',
      updatedAt: new Date('2026-04-29T00:00:00.000Z'),
    })

    await expect(getActiveTournamentId()).resolves.toBe('t1')

    expect(prismaMock.appSetting.findUnique).toHaveBeenCalledWith({
      where: { key: ACTIVE_TOURNAMENT_SETTING_KEY },
      select: { value: true },
    })
  })

  test('returns the active tournament when the setting points to an existing tournament', async () => {
    mockResolved(prismaMock.appSetting.findUnique, {
      value: 't1',
    })
    mockResolved(prismaMock.tournament.findUnique, {
      id: 't1',
      name: 'Active Cup',
    })

    await expect(getActiveTournament()).resolves.toMatchObject({
      id: 't1',
      name: 'Active Cup',
    })

    expect(prismaMock.tournament.findUnique).toHaveBeenCalledWith({
      where: { id: 't1' },
    })
  })

  test('sets an existing tournament active', async () => {
    mockResolved(prismaMock.tournament.findUnique, { id: 't1' })
    mockResolved(prismaMock.appSetting.upsert, {})

    await setActiveTournament('t1')

    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      where: { key: ACTIVE_TOURNAMENT_SETTING_KEY },
      create: {
        key: ACTIVE_TOURNAMENT_SETTING_KEY,
        value: 't1',
      },
      update: {
        value: 't1',
      },
    })
  })

  test('rejects a missing tournament before updating the active setting', async () => {
    mockResolved(prismaMock.tournament.findUnique, null)

    await expect(setActiveTournament('missing')).rejects.toThrow('Tournament missing was not found.')

    expect(prismaMock.appSetting.upsert).not.toHaveBeenCalled()
  })

  test('clears active tournament settings', async () => {
    mockResolved(prismaMock.appSetting.deleteMany, { count: 1 })

    await clearActiveTournament()

    expect(prismaMock.appSetting.deleteMany).toHaveBeenCalledWith({
      where: { key: ACTIVE_TOURNAMENT_SETTING_KEY },
    })
  })

  test('clears the active tournament only when the deleted id matches', async () => {
    mockResolved(prismaMock.appSetting.deleteMany, { count: 1 })

    await clearActiveTournamentIfMatches('t1')

    expect(prismaMock.appSetting.deleteMany).toHaveBeenCalledWith({
      where: {
        key: ACTIVE_TOURNAMENT_SETTING_KEY,
        value: 't1',
      },
    })
  })
})
