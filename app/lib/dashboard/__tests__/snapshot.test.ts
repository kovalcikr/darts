import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { getDashboardSnapshot, getMatchCacheTag, createTableCacheTags } from '../snapshot';
import type { CueScoreMatch } from '@/app/lib/integrations/cuescore/types';
import type { DashboardTournamentFetcher } from '../tournament-fetcher';

jest.mock('@/app/lib/table-mappings', () => ({
  getTableIdBySlot: jest.fn().mockResolvedValue('table1'),
}));

jest.mock('@/app/lib/data', () => ({
  findMatchLiveStates: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/lib/dashboard/tournament-fetcher', () => ({
  createDefaultTournamentFetcher: jest.fn(),
}));

const mockCueScoreMatch = (overrides: Partial<CueScoreMatch> = {}): CueScoreMatch => ({
  matchId: '1',
  roundName: 'Final',
  round: 1,
  playerA: { playerId: 1, name: 'Player A', image: '' },
  playerB: { playerId: 2, name: 'Player B', image: '' },
  raceTo: 3,
  tournamentId: 1,
  matchstatus: 'playing' as const,
  table: { name: '1' },
  scoreA: 0,
  scoreB: 1,
  ...overrides,
});

describe('dashboard snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns nested structure with arrays', async () => {
    const mockFetcher: DashboardTournamentFetcher = {
      getMatchInTable: jest.fn().mockResolvedValue(null),
    };

    const result = await getDashboardSnapshot('t1', mockFetcher);

    expect(result).toHaveProperty('matches');
    expect(result).toHaveProperty('liveStates');
    expect(result).toHaveProperty('tableIds');
    expect(result.matches).toHaveLength(6);
    expect(result.liveStates).toHaveLength(6);
    expect(result.tableIds).toHaveLength(6);
  });

  test('getMatchCacheTag generates correct tag', () => {
    expect(getMatchCacheTag(1)).toBe('match1');
    expect(getMatchCacheTag(2)).toBe('match2');
    expect(getMatchCacheTag(6)).toBe('match6');
  });

  test('createTableCacheTags generates correct tags', () => {
    expect(createTableCacheTags(1)).toEqual({
      match: 'match1',
      matchInfo: 'matchInfo1',
      firstPlayer: 'firstPlayer1',
    });
    expect(createTableCacheTags(6)).toEqual({
      match: 'match6',
      matchInfo: 'matchInfo6',
      firstPlayer: 'firstPlayer6',
    });
  });

  test('uses injected fetcher to get matches', async () => {
    const match = mockCueScoreMatch();
    const mockFetcher: DashboardTournamentFetcher = {
      getMatchInTable: jest.fn().mockResolvedValue(match),
    };

    await getDashboardSnapshot('t1', mockFetcher);

    expect(mockFetcher.getMatchInTable).toHaveBeenCalledWith('t1', 'table1');
  });
});