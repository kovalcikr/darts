import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as tableMappings from '@/app/lib/table-mappings'
import * as data from '@/app/lib/data'
import * as match from '@/app/lib/match'
import * as playerThrow from '@/app/lib/playerThrow'

jest.mock('@/app/lib/table-mappings', () => ({
  getTableIdBySlot: jest.fn().mockResolvedValue('table1'),
}))

jest.mock('@/app/lib/data', () => ({
  findMatchLiveStates: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/app/lib/match', () => ({
  getCuescoreMatchCached: jest.fn().mockResolvedValue(null),
  getMatch: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/app/lib/playerThrow', () => ({
  getPlayerThrowInfo: jest.fn().mockResolvedValue(null),
  findMatchAvg: jest.fn().mockResolvedValue(null),
}))

// Disable caching for these tests - just pass through to inner function
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

const { getDashboardTournamentSnapshot } = require('../snapshot')

describe('Dashboard caching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getDashboardTournamentSnapshot executes successfully', async () => {
    const result = await getDashboardTournamentSnapshot('t1')

    expect(result).toBeDefined()
    expect(match.getCuescoreMatchCached).toHaveBeenCalled()
  })

  test('getDashboardTournamentSnapshot returns nested structure', async () => {
    const result = await getDashboardTournamentSnapshot('t1')

    expect(result).toHaveProperty('matches')
    expect(result).toHaveProperty('liveStates')
    expect(result).toHaveProperty('matchInfos')
    expect(result).toHaveProperty('tableIds')
    expect(result).toHaveProperty('firstPlayers')
    expect(result).toHaveProperty('matchAvgA')
    expect(result).toHaveProperty('matchAvgB')
    expect(result.matches).toHaveLength(6)
    expect(result.liveStates).toHaveLength(6)
  })
})