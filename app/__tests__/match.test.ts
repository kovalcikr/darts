import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import * as match from '../lib/match';
import type { Match } from '@/prisma/client';
import * as data from '../lib/data';
import * as matchLiveState from '../lib/match-live-state';
import prisma from '../lib/db';

jest.mock('../lib/data', () => ({
  findMatch: jest.fn(),
  findThrowsByMatch: jest.fn(),
  findHighestScoreInMatch: jest.fn(),
  findBestCheckoutInMatch: jest.fn(),
  findBestLegInMatch: jest.fn(),
  findScoreboardThrowHistory: jest.fn(),
  updateMatchFirstPlayer: jest.fn(),
  aggregateMatchThrows: jest.fn(),
}));
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));
jest.mock('../lib/match-live-state', () => ({
  refreshMatchLiveState: jest.fn(),
  findMatchLiveStates: jest.fn(),
}));
jest.mock('../lib/db', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}));

const mockMatch: Match & { tournament: { id: string; name: string } } = {
  id: 'm1',
  round: 'r1',
  playerAId: 'pA',
  playerAName: 'Player A',
  playerAImage: 'imgA',
  playerBId: 'pB',
  playerBName: 'Player B',
  playerBImage: 'imgB',
  runTo: 5,
  playerALegs: 1,
  playerBlegs: 0,
  isComplete: false,
  firstPlayer: 'pA',
  tournamentId: 't1',
  tournament: { id: 't1', name: 'Test Tournament' },
};

const mockLiveState = {
  matchId: 'm1',
  tournamentId: 't1',
  table: '1',
  leg: 1,
  playerAScoreLeft: 401,
  playerBScoreLeft: 451,
  playerATotalScore: 100,
  playerBTotalScore: 50,
  playerATotalDarts: 3,
  playerBTotalDarts: 3,
  activePlayerId: 'pB',
  startingPlayerId: 'pA',
  lastThrows: [
    { playerId: 'pA', score: 60, darts: 2, checkout: false, leg: 1 },
    { playerId: 'pB', score: 50, darts: 2, checkout: false, leg: 1 },
  ],
};

describe('match - getLiveScoringData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(async (fn) => {
      await fn({} as never);
    });
  });

  test('returns scoring data from MatchLiveState projection', async () => {
    jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
    jest.mocked(matchLiveState.findMatchLiveStates).mockResolvedValue([mockLiveState]);
    jest.mocked(data.findScoreboardThrowHistory).mockResolvedValue([]);

    const result = await match.getLiveScoringData('m1');

    expect(result).not.toBeNull();
    expect(result!.match.id).toBe('m1');
    expect(result!.playerA.score).toBe(401);
    expect(result!.playerB.score).toBe(451);
    expect(result!.playerA.matchAvg).toBe(100);
    expect(result!.playerB.matchAvg).toBeCloseTo(50);
    expect(result!.nextPlayer).toBe('pB');
    expect(result!.startingPlayerId).toBe('pA');
    expect(result!.playerA.active).toBe(false);
    expect(result!.playerB.active).toBe(true);
    expect(result!.playerA.lastThrow).toBe(60);
    expect(result!.playerB.lastThrow).toBe(50);
  });

  test('returns null when match does not exist', async () => {
    jest.mocked(data.findMatch).mockResolvedValue(null);

    const result = await match.getLiveScoringData('missing');

    expect(result).toBeNull();
  });

  test('returns pre-start state when MatchLiveState does not exist', async () => {
    jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
    jest.mocked(matchLiveState.findMatchLiveStates).mockResolvedValue([]);

    const result = await match.getLiveScoringData('m1');

    expect(result).not.toBeNull();
    expect(result!.startingPlayerId).toBeNull();
    expect(result!.playerA.score).toBe(501);
    expect(result!.playerB.score).toBe(501);
    expect(result!.playerA.active).toBe(false);
    expect(result!.playerA.matchAvg).toBe(0);
    expect(result!.throwHistory).toEqual([]);
  });
});

describe('match - getMatchDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns match details with computed stats', async () => {
    jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
    jest.mocked(data.findThrowsByMatch).mockResolvedValue([]);
    jest.mocked(data.aggregateMatchThrows).mockResolvedValue({
      _sum: { score: 100, darts: 3 },
    } as any);
    jest.mocked(data.findHighestScoreInMatch).mockResolvedValue(180);
    jest.mocked(data.findBestCheckoutInMatch).mockResolvedValue(100);
    jest.mocked(data.findBestLegInMatch).mockResolvedValue(9);

    const result = await match.getMatchDetails('m1');

    expect(result).not.toBeNull();
    expect(result!.playerA.name).toBe('Player A');
    expect(result!.playerB.name).toBe('Player B');
    expect(result!.playerA.matchAvg).toBe(100);
    expect(result!.playerA.legCount).toBe(1);
    expect(result!.playerA.highestScore).toBe(180);
    expect(result!.playerA.bestCheckout).toBe(100);
    expect(result!.playerA.bestLeg).toBe(9);
  });

  test('returns null when match does not exist', async () => {
    jest.mocked(data.findMatch).mockResolvedValue(null);

    const result = await match.getMatchDetails('missing');

    expect(result).toBeNull();
  });
});

describe('match - startMatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as unknown as jest.Mock).mockImplementation(async (fn) => {
      await fn({} as never);
    });
  });

  test('startMatch uses transaction to update first player and refresh live state', async () => {
    jest.mocked(data.updateMatchFirstPlayer).mockResolvedValue({} as any);
    jest.mocked(matchLiveState.refreshMatchLiveState).mockResolvedValue({} as any);

    const formData = new FormData();
    formData.append('matchId', 'm1');
    formData.append('firstPlayer', 'pA');
    formData.append('table', '1');

    await match.startMatch(formData);

    expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', 'pA', expect.anything());
    expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '1', expect.anything());
  });
});