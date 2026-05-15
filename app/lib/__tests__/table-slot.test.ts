import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import * as data from '@/app/lib/data'
import * as match from '@/app/lib/match'
import * as playerThrow from '@/app/lib/playerThrow'

jest.mock('@/app/lib/table-mappings', () => ({
  getTableMappings: jest.fn().mockResolvedValue([
    { slot: 1, cuescoreTableName: 'table1' },
    { slot: 2, cuescoreTableName: 'table2' },
  ]),
}))

jest.mock('@/app/lib/data', () => ({
  findMatchLiveStates: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/app/lib/match', () => ({
  getCuescoreMatchCached: jest.fn().mockResolvedValue(null),
  getMatch: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/app/lib/playerThrow', () => ({
  findMatchAvg: jest.fn().mockResolvedValue(null),
  getPlayerThrowInfo: jest.fn().mockResolvedValue(null),
}))

// Disable caching for these tests - just pass through to inner function
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

const { getDashboardSnapshot } = require('@/app/lib/table-slot')

describe('Table Slot Snapshot Module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns correct structure when no matches', async () => {
    const result = await getDashboardSnapshot('t1')

    expect(result).toHaveProperty('match1')
    expect(result).toHaveProperty('match2')
    expect(result).toHaveProperty('liveState1')
    expect(result).toHaveProperty('liveState2')
    expect(result).toHaveProperty('firstPlayer1')
    expect(result).toHaveProperty('firstPlayer2')
    expect(result).toHaveProperty('matchInfo1')
    expect(result).toHaveProperty('matchInfo2')
    expect(result.match1).toBeNull()
    expect(result.match2).toBeNull()
  })

  test('includes live state when available', async () => {
    const mockLiveState = {
      matchId: 'm1',
      playerAScoreLeft: 401,
      playerBScoreLeft: 441,
      playerATotalScore: 100,
      playerBTotalScore: 60,
      playerATotalDarts: 3,
      playerBTotalDarts: 3,
      activePlayerId: 'pA',
      startingPlayerId: 'pA',
      lastThrows: [],
    }
    jest.mocked(match.getCuescoreMatchCached).mockResolvedValue({
      matchId: 'm1',
      playerA: { playerId: 'pA' },
      playerB: { playerId: 'pB' },
    } as never)
    jest.mocked(data.findMatchLiveStates).mockResolvedValueOnce([mockLiveState] as never)

    const result = await getDashboardSnapshot('t1')

    expect(result.match1).not.toBeNull()
    expect(result.liveState1).toEqual(mockLiveState)
    expect(result.firstPlayer1).toBe('pA')
    expect(result.matchAvgA1).toBe(100)
    expect(result.matchAvgB1).toBe(60)
  })

  test('falls back to database when no live state', async () => {
    const mockMatch = {
      matchId: 'm1',
      playerA: { playerId: 'pA' },
      playerB: { playerId: 'pB' },
      scoreA: 1,
      scoreB: 0,
    }
    const mockDbMatch = {
      id: 'm1',
      firstPlayer: 'pA',
    }
    const mockMatchInfo = {
      score: [
        { playerId: 'pA', _sum: { score: 100 } },
        { playerId: 'pB', _sum: { score: 60 } },
      ],
      lastThrows: [],
    }

    jest.mocked(match.getCuescoreMatchCached).mockResolvedValue(mockMatch as never)
    jest.mocked(match.getMatch).mockResolvedValueOnce(mockDbMatch as never)
    jest.mocked(playerThrow.findMatchAvg).mockResolvedValueOnce(75).mockResolvedValueOnce(60) as never
    jest.mocked(playerThrow.getPlayerThrowInfo).mockResolvedValueOnce(mockMatchInfo as never)

    const result = await getDashboardSnapshot('t1')

    expect(result.match1).not.toBeNull()
    expect(result.liveState1).toBeNull()
    expect(result.firstPlayer1).toBe('pA')
    expect(result.matchInfo1).toEqual(mockMatchInfo)
    expect(result.matchAvgA1).toBe(75)
    expect(result.matchAvgB1).toBe(60)
  })
})