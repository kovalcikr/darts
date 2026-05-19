import { test, expect, describe, beforeEach, jest } from '@jest/globals';
import type { Prisma } from '@/prisma/client';
import prisma from '@/app/lib/db';
import { MatchRepository } from '../match-repository';

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    playerThrow: {
      aggregate: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    matchLiveState: {
      upsert: jest.fn(),
    },
  },
}));

const mockTx = {} as unknown as Prisma.TransactionClient;

describe('MatchRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) => fn(mockTx));
  });

  describe('recordThrow', () => {
    test('stores a normal throw when score is valid', async () => {
      const mockMatch = {
        id: 'm1',
        tournamentId: 't1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        runTo: 3,
        firstPlayer: 'pA',
      };

      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch as any);
      (prisma.playerThrow.aggregate as jest.Mock).mockResolvedValue({ _sum: { score: 0 } } as any);

      const repo = new MatchRepository();
      await repo.recordThrow({
        matchId: 'm1',
        tournamentId: 't1',
        leg: 1,
        playerId: 'pA',
        score: 100,
        darts: 3,
        table: '11',
      });

      expect(prisma.playerThrow.aggregate).toHaveBeenCalledWith({
        _sum: { score: true },
        where: expect.objectContaining({
          matchId: 'm1',
          leg: 1,
          playerId: 'pA',
          undoneAt: null,
        }),
      });

      expect(prisma.playerThrow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          matchId: 'm1',
          leg: 1,
          playerId: 'pA',
          score: 100,
          darts: 3,
          checkout: false,
        }),
      });
    });

    test('rejects bust scores without mutating state', async () => {
      const mockMatch = {
        id: 'm1',
        tournamentId: 't1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        runTo: 3,
        firstPlayer: 'pA',
      };

      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch as any);
      (prisma.playerThrow.aggregate as jest.Mock).mockResolvedValue({ _sum: { score: 500 } } as any);

      const repo = new MatchRepository();

      await expect(repo.recordThrow({
        matchId: 'm1',
        tournamentId: 't1',
        leg: 1,
        playerId: 'pA',
        score: 2,
        darts: 1,
        table: '11',
      })).rejects.toThrow('Bust');

      expect(prisma.playerThrow.create).not.toHaveBeenCalled();
    });

    test('closes leg and returns completedLeg=true when reaching zero', async () => {
      const mockMatch = {
        id: 'm1',
        tournamentId: 't1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        runTo: 3,
        firstPlayer: 'pA',
      };

      (prisma.match.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockMatch as any) // initial fetch
        .mockResolvedValueOnce(mockMatch as any); // after throw
      (prisma.playerThrow.aggregate as jest.Mock).mockResolvedValue({ _sum: { score: 401 } } as any);
      (prisma.match.update as jest.Mock).mockResolvedValue({
        ...mockMatch,
        playerALegs: 1,
      } as any);

      const repo = new MatchRepository();
      const result = await repo.recordThrow({
        matchId: 'm1',
        tournamentId: 't1',
        leg: 1,
        playerId: 'pA',
        score: 100,
        darts: 2,
        table: '11',
      });

      expect(result.completedLeg).toBe(true);
      expect(prisma.match.update).toHaveBeenCalled();
    });

    test('invalidates redoable throws before recording new throw', async () => {
      const mockMatch = {
        id: 'm1',
        tournamentId: 't1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        runTo: 3,
        firstPlayer: 'pA',
      };

      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch as any);
      (prisma.playerThrow.aggregate as jest.Mock).mockResolvedValue({ _sum: { score: 0 } } as any);

      const repo = new MatchRepository();
      await repo.recordThrow({
        matchId: 'm1',
        tournamentId: 't1',
        leg: 1,
        playerId: 'pA',
        score: 100,
        darts: 3,
        table: '11',
      });

      expect(prisma.playerThrow.updateMany).toHaveBeenCalledWith({
        where: {
          matchId: 'm1',
          undoneAt: { not: null },
          redoInvalidatedAt: null,
        },
        data: { redoInvalidatedAt: expect.any(Date) },
      });
    });
  });

  describe('undoThrow', () => {
    test('marks the latest throw in the current leg as undone', async () => {
      const mockMatch = {
        id: 'm1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 1,
        playerBlegs: 0,
        runTo: 3,
      };

      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch as any);
      (prisma.playerThrow.findFirst as jest.Mock).mockResolvedValue({
        id: 'throw-1',
        playerId: 'pA',
        checkout: false,
      } as any);

      const repo = new MatchRepository();
      await repo.undoThrow('m1', 1);

      expect(prisma.playerThrow.update).toHaveBeenCalledWith({
        where: { id: 'throw-1' },
        data: {
          undoneAt: expect.any(Date),
          redoInvalidatedAt: null,
        },
      });
    });

    test('resets the starting player when no throws exist yet', async () => {
      const mockMatch = {
        id: 'm1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        runTo: 3,
      };

      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch as any);
      (prisma.playerThrow.findFirst as jest.Mock).mockResolvedValue(null);

      const repo = new MatchRepository();
      await repo.undoThrow('m1', 1);

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { firstPlayer: null },
      });
    });
  });

  describe('getLegThrows', () => {
    test('returns throws for the specified leg', async () => {
      (prisma.playerThrow.findMany as jest.Mock).mockResolvedValue([
        { playerId: 'pA', score: 100, darts: 3, checkout: false },
        { playerId: 'pB', score: 50, darts: 3, checkout: false },
      ] as any);

      const repo = new MatchRepository();
      const throws = await repo.getLegThrows('m1', 1, 'pA', 'pB');

      expect(throws).toHaveLength(2);
      expect(prisma.playerThrow.findMany).toHaveBeenCalledWith({
        where: {
          matchId: 'm1',
          leg: 1,
          playerId: { in: ['pA', 'pB'] },
          undoneAt: null,
        },
        select: { playerId: true, score: true, darts: true, checkout: true },
        orderBy: { time: 'asc' },
      });
    });
  });

  describe('getMatchState', () => {
    test('assembles match state from throws and averages', async () => {
      const mockMatch = {
        id: 'm1',
        tournamentId: 't1',
        playerAId: 'pA',
        playerBId: 'pB',
        playerALegs: 0,
        playerBlegs: 0,
        runTo: 3,
        firstPlayer: 'pA',
      };

      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch as any);
      (prisma.playerThrow.findMany as jest.Mock).mockResolvedValue([
        { playerId: 'pA', score: 401, darts: 6, checkout: false },
        { playerId: 'pB', score: 60, darts: 3, checkout: false },
      ] as any);
      (prisma.playerThrow.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { score: 500, darts: 10 } } as any)
        .mockResolvedValueOnce({ _sum: { score: 60, darts: 3 } } as any);

      const repo = new MatchRepository();
      const state = await repo.getMatchState('m1');

      expect(state).not.toBeNull();
      expect(state?.scores.playerAScoreLeft).toBe(100);
      expect(state?.scores.playerBScoreLeft).toBe(441);
    });

    test('returns null when match not found', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

      const repo = new MatchRepository();
      const state = await repo.getMatchState('nonexistent');

      expect(state).toBeNull();
    });
  });
});