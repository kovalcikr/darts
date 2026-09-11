import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as tableMappings from '@/app/lib/table-mappings'
import * as matchLiveState from '@/app/lib/match-live-state'
import * as match from '@/app/lib/match'
import * as playerThrow from '@/app/lib/playerThrow'

jest.mock('@/app/lib/table-mappings', () => ({
  getTableMappings: jest.fn().mockResolvedValue([
    { slot: 1, cuescoreTableName: 'table1' },
    { slot: 3, cuescoreTableName: 'table3' },
  ]),
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

  test('returns one ordered record per configured mapping and preserves Slots', async () => {
    const result = await getDashboardTournamentSnapshot('t1')

    expect(result).toEqual({
      tables: [
        expect.objectContaining({ slot: 1, match: null }),
        expect.objectContaining({ slot: 3, match: null }),
      ],
    })
  })
})
