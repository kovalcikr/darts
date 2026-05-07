import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { getDashboardSnapshot, getMatchCacheTag, getLiveMatchInfo, getLiveAverage, createTableCacheTags } from '../snapshot';
import { prismaMock } from '@/app/__tests__/mocks';
import type { CueScoreMatch } from '@/app/lib/integrations/cuescore/types';
import type { MatchLiveState } from '@/app/lib/match-live-state/model';

const mockCueScoreMatch = (overrides: Partial<CueScoreMatch> = {}): CueScoreMatch => ({
  matchId: '1',
  roundName: 'Final',
  round: 1,
  playerA: { playerId: 1, name: 'Player A', image: '' },
  playerB: { playerId: 2, name: 'Player B', image: '' },
  raceTo: 3,
  tournamentId: 1,
  matchstatus: 'playing' as const,
  table: { name: '1', nameNumeric: 1 },
  scoreA: 0,
  scoreB: 1,
  ...overrides,
});

describe('dashboard snapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns nested structure with arrays', async () => {
    prismaMock.matchLiveState.findMany.mockResolvedValue([]);
    
    const result = await getDashboardSnapshot('t1');

    expect(result).toHaveProperty('matches');
    expect(result).toHaveProperty('liveStates');
    expect(result).toHaveProperty('matchInfos');
    expect(result).toHaveProperty('tableIds');
    expect(result).toHaveProperty('firstPlayers');
    expect(result).toHaveProperty('matchAvgA');
    expect(result).toHaveProperty('matchAvgB');
    expect(result.matches).toHaveLength(6);
    expect(result.liveStates).toHaveLength(6);
  });

  test('getMatchCacheTag generates correct tag', () => {
    expect(getMatchCacheTag(1)).toBe('match1');
    expect(getMatchCacheTag(2)).toBe('match2');
    expect(getMatchCacheTag(6)).toBe('match6');
  });

  test('getLiveMatchInfo returns null when no live state', () => {
    const match = mockCueScoreMatch({ matchId: 'm1', playerA: { playerId: 1, name: 'A', image: '' }, playerB: { playerId: 2, name: 'B', image: '' } });
    const result = getLiveMatchInfo(null, match);
    expect(result).toBeNull();
  });

  test('getLiveAverage calculates correct average', () => {
    const liveState: MatchLiveState = {
      matchId: 'm1',
      tournamentId: 't1',
      table: '1',
      leg: 1,
      playerAScoreLeft: 401,
      playerBScoreLeft: 501,
      playerATotalScore: 100,
      playerBTotalScore: 0,
      playerATotalDarts: 3,
      playerBTotalDarts: 0,
      activePlayerId: 'pA',
      startingPlayerId: 'pA',
      lastThrows: [],
    };
    expect(getLiveAverage(liveState, 'A')).toBe(100);
    expect(getLiveAverage(liveState, 'B')).toBe(0);
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
});