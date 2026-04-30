import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { findMatchLiveStates, refreshMatchLiveState } from '../lib/data';
import { prismaMock } from './mocks';

describe('match live state projection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rebuilds live state from the durable throw log', async () => {
    const prisma = prismaMock as any;
    prisma.match.findUnique.mockResolvedValue({
      id: 'm1',
      tournamentId: 't1',
      playerAId: 'pA',
      playerBId: 'pB',
      playerALegs: 0,
      playerBlegs: 0,
      firstPlayer: 'pA',
    });
    prisma.playerThrow.groupBy
      .mockResolvedValueOnce([
        { playerId: 'pA', _sum: { score: 100, darts: 3 } },
        { playerId: 'pB', _sum: { score: 60, darts: 3 } },
      ])
      .mockResolvedValueOnce([
        { playerId: 'pA', _sum: { score: 100 }, _count: { id: 1 } },
        { playerId: 'pB', _sum: { score: 60 }, _count: { id: 1 } },
      ]);
    prisma.playerThrow.findMany.mockResolvedValue([
      { playerId: 'pB', score: 60, darts: 3, checkout: false, leg: 1 },
      { playerId: 'pA', score: 100, darts: 3, checkout: false, leg: 1 },
    ]);
    prisma.matchLiveState.upsert.mockResolvedValue({ matchId: 'm1' });

    await refreshMatchLiveState('m1', '11');

    expect(prisma.playerThrow.groupBy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          undoneAt: null,
          matchId: 'm1',
        },
      }),
    );
    expect(prisma.playerThrow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          undoneAt: null,
          matchId: 'm1',
          leg: 1,
        },
      }),
    );
    expect(prisma.matchLiveState.upsert).toHaveBeenCalledWith({
      create: expect.objectContaining({
        matchId: 'm1',
        tournamentId: 't1',
        table: '11',
        leg: 1,
        playerAScoreLeft: 401,
        playerBScoreLeft: 441,
        playerATotalScore: 100,
        playerBTotalScore: 60,
        playerATotalDarts: 3,
        playerBTotalDarts: 3,
        activePlayerId: 'pA',
        startingPlayerId: 'pA',
        lastThrows: [
          { playerId: 'pB', score: 60, darts: 3, checkout: false, leg: 1 },
          { playerId: 'pA', score: 100, darts: 3, checkout: false, leg: 1 },
        ],
      }),
      update: expect.objectContaining({
        table: '11',
        playerAScoreLeft: 401,
        playerBScoreLeft: 441,
        activePlayerId: 'pA',
        startingPlayerId: 'pA',
      }),
      where: {
        matchId: 'm1',
      },
    });
  });

  test('returns live states for the requested matches only', async () => {
    const prisma = prismaMock as any;
    prisma.matchLiveState.findMany.mockResolvedValue([{ matchId: 'm1' }]);

    const liveStates = await findMatchLiveStates(['m1', 'm2']);

    expect(liveStates).toEqual([{ matchId: 'm1' }]);
    expect(prisma.matchLiveState.findMany).toHaveBeenCalledWith({
      where: {
        matchId: {
          in: ['m1', 'm2'],
        },
      },
    });
  });
});
