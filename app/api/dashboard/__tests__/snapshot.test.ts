import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as tableMappings from '@/app/lib/table-mappings'
import * as matchLiveState from '@/app/lib/match-live-state'
import * as match from '@/app/lib/match'
import * as playerThrow from '@/app/lib/playerThrow'

jest.mock('@/app/lib/table-mappings', () => ({
  getTableIdBySlot: jest.fn().mockResolvedValue('table1'),
}))

jest.mock('@/app/lib/match-live-state', () => ({
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

  test('getDashboardTournamentSnapshot returns all expected fields', async () => {
    const result = await getDashboardTournamentSnapshot('t1')

    expect(result).toHaveProperty('match1')
    expect(result).toHaveProperty('match2')
    expect(result).toHaveProperty('match3')
    expect(result).toHaveProperty('match4')
    expect(result).toHaveProperty('match5')
    expect(result).toHaveProperty('match6')
    expect(result).toHaveProperty('liveState1')
    expect(result).toHaveProperty('liveState2')
    expect(result).toHaveProperty('matchInfo1')
    expect(result).toHaveProperty('matchAvgA1')
    expect(result).toHaveProperty('matchAvgB1')
  })
})