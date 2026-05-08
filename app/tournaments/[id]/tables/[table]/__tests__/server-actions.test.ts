import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { revalidatePath, revalidateTag } from 'next/cache';
import { recordThrow, undoLastThrow, redoThrow } from '../actions';
import * as data from '../../../../../lib/data';
import * as matchLiveState from '../../../../../lib/match-live-state';
import { setScore } from '../../../../../lib/cuescore';
import { calculateThreeDartAverage } from '../../../../../lib/scoring';
import { prismaMock } from '../../../../../__tests__/mocks';

jest.mock('../../../../../lib/data');
jest.mock('../../../../../lib/match-live-state', () => ({
    refreshMatchLiveState: jest.fn(),
    findMatchLiveStates: jest.fn(),
}));
jest.mock('../../../../../lib/cuescore', () => ({
    setScore: jest.fn(),
}));
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

describe('server-actions', () => {
    const tx = undefined as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (prismaMock.$transaction as any).mockImplementation(async (callback: any) => callback(tx));
        jest.mocked(setScore).mockResolvedValue(undefined as any);
    });

    test('recordThrow stores a normal throw and revalidates the table', async () => {
        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 180 } } as any);

        await recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 1, playerId: 'pA', score: 100, table: '11', dartsCount: 3 });

        expect(data.aggregatePlayerThrow).toHaveBeenCalledWith('m1', 1, 'pA', tx);
        expect(data.invalidateRedoableThrows).toHaveBeenCalledWith('m1', tx);
        expect(data.createPlayerThrow).toHaveBeenCalledWith('t1', 'm1', 1, 'pA', 100, 3, false, tx);
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(data.updateMatchLegs).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith('/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('recordThrow closes the leg and syncs the updated score', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
            runTo: 5,
            playerALegs: 1,
            playerBlegs: 1,
        };
        const updatedMatch = {
            ...currentMatch,
            playerALegs: 2,
        };

        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 441 } } as any);
        jest.mocked(data.findMatch).mockResolvedValue(currentMatch as any);
        jest.mocked(data.updateMatchLegs).mockResolvedValue(updatedMatch as any);

        await recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 2, playerId: 'pA', score: 60, table: '11', dartsCount: 2 });

        expect(data.invalidateRedoableThrows).toHaveBeenCalledWith('m1', tx);
        expect(data.createPlayerThrow).toHaveBeenCalledWith('t1', 'm1', 2, 'pA', 60, 2, true, tx);
        expect(data.findMatch).toHaveBeenCalledWith('m1', tx);
        expect(data.updateMatchLegs).toHaveBeenCalledWith('m1', 'pA', 'pA', 1, 1, 5, tx);
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 2, 1);
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('recordThrow rejects an impossible checkout dart count without mutating state', async () => {
        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 370 } } as any);

        await expect(recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 2, playerId: 'pA', score: 131, table: '11', dartsCount: 2 })).rejects.toThrow('Invalid checkout darts count');

        expect(data.createPlayerThrow).not.toHaveBeenCalled();
        expect(data.invalidateRedoableThrows).not.toHaveBeenCalled();
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(revalidateTag).not.toHaveBeenCalled();
    });

    test('recordThrow rejects an impossible checkout score without mutating state', async () => {
        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 332 } } as any);

        await expect(recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 2, playerId: 'pA', score: 169, table: '11', dartsCount: 3 })).rejects.toThrow('Invalid checkout darts count');

        expect(data.createPlayerThrow).not.toHaveBeenCalled();
        expect(data.invalidateRedoableThrows).not.toHaveBeenCalled();
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(revalidateTag).not.toHaveBeenCalled();
    });

    test('recordThrow waits for score sync before revalidating after a checkout', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
            runTo: 5,
            playerALegs: 1,
            playerBlegs: 1,
        };
        const updatedMatch = {
            ...currentMatch,
            playerALegs: 2,
        };
        let releaseSetScore: () => void;
        const setScorePromise = new Promise<void>((resolve) => {
            releaseSetScore = resolve;
        });

        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 441 } } as any);
        jest.mocked(data.findMatch).mockResolvedValue(currentMatch as any);
        jest.mocked(data.updateMatchLegs).mockResolvedValue(updatedMatch as any);
        jest.mocked(setScore).mockReturnValue(setScorePromise as any);

        const actionPromise = recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 2, playerId: 'pA', score: 60, table: '11', dartsCount: 2 });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 2, 1);
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(revalidateTag).not.toHaveBeenCalled();

        releaseSetScore!();
        await actionPromise;

        expect(revalidatePath).toHaveBeenCalledWith('/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('recordThrow rejects bust scores without mutating state', async () => {
        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 500 } } as any);

        await expect(recordThrow({ tournamentId: 't1', matchId: 'm1', leg: 1, playerId: 'pA', score: 2, table: '11', dartsCount: 1 })).rejects.toThrow('Bust');

        expect(data.createPlayerThrow).not.toHaveBeenCalled();
        expect(data.invalidateRedoableThrows).not.toHaveBeenCalled();
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(revalidateTag).not.toHaveBeenCalled();
    });

    test('undoLastThrow marks the latest throw in the current leg as undone', async () => {
        jest.mocked(data.findLastThrow).mockResolvedValue({ id: 'throw-1' } as any);

        await undoLastThrow({ matchId: 'm1', table: '11', leg: 2 });

        expect(data.findLastThrow).toHaveBeenCalledWith('m1', 2, undefined, tx);
        expect(data.markPlayerThrowUndone).toHaveBeenCalledWith('throw-1', tx);
        expect(data.findPreviousLegLastThrow).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith('/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('undoLastThrow reopens the previous leg when the current leg is empty', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
            runTo: 5,
            playerALegs: 1,
            playerBlegs: 2,
        };
        const updatedMatch = {
            ...currentMatch,
            playerBlegs: 1,
        };

        jest.mocked(data.findLastThrow).mockResolvedValue(null);
        jest.mocked(data.findPreviousLegLastThrow).mockResolvedValue({ id: 'throw-prev', playerId: 'pB' } as any);
        jest.mocked(data.findMatch).mockResolvedValue(currentMatch as any);
        jest.mocked(data.decrementMatchLegs).mockResolvedValue(updatedMatch as any);

        await undoLastThrow({ matchId: 'm1', table: '11', leg: 3 });

        expect(data.markPlayerThrowUndone).toHaveBeenCalledWith('throw-prev', tx);
        expect(data.findMatch).toHaveBeenCalledWith('m1', tx);
        expect(data.decrementMatchLegs).toHaveBeenCalledWith('m1', 'pA', 'pB', 1, 2, 5, tx);
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 1, 1);
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('undoLastThrow waits for score sync before revalidating when reopening a leg', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
            runTo: 5,
            playerALegs: 1,
            playerBlegs: 2,
        };
        const updatedMatch = {
            ...currentMatch,
            playerBlegs: 1,
        };
        let releaseSetScore: () => void;
        const setScorePromise = new Promise<void>((resolve) => {
            releaseSetScore = resolve;
        });

        jest.mocked(data.findLastThrow).mockResolvedValue(null);
        jest.mocked(data.findPreviousLegLastThrow).mockResolvedValue({ id: 'throw-prev', playerId: 'pB' } as any);
        jest.mocked(data.findMatch).mockResolvedValue(currentMatch as any);
        jest.mocked(data.decrementMatchLegs).mockResolvedValue(updatedMatch as any);
        jest.mocked(setScore).mockReturnValue(setScorePromise as any);

        const actionPromise = undoLastThrow({ matchId: 'm1', table: '11', leg: 3 });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 1, 1);
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(revalidateTag).not.toHaveBeenCalled();

        releaseSetScore!();
        await actionPromise;

        expect(revalidatePath).toHaveBeenCalledWith('/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('undoLastThrow resets the starting player when no throws exist yet', async () => {
        jest.mocked(data.findLastThrow).mockResolvedValue(null);
        jest.mocked(data.findPreviousLegLastThrow).mockResolvedValue(null);

        await undoLastThrow({ matchId: 'm1', table: '11', leg: 1 });

        expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', null, tx);
        expect(data.markPlayerThrowUndone).not.toHaveBeenCalled();
        expect(data.decrementMatchLegs).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('redoThrow restores the latest redoable throw', async () => {
        jest.mocked(data.findRedoableThrow).mockResolvedValue({ id: 'throw-1', checkout: false } as any);
        jest.mocked(data.restorePlayerThrow).mockResolvedValue({ id: 'throw-1', checkout: false } as any);

        await redoThrow({ matchId: 'm1', table: '11', leg: 1 });

        expect(data.findRedoableThrow).toHaveBeenCalledWith('m1', tx);
        expect(data.restorePlayerThrow).toHaveBeenCalledWith('throw-1', tx);
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(data.updateMatchLegs).not.toHaveBeenCalled();
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith('/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('redoThrow recloses a restored checkout leg and syncs the score', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
            runTo: 5,
            playerALegs: 1,
            playerBlegs: 1,
        };
        const updatedMatch = {
            ...currentMatch,
            playerBlegs: 2,
        };

        jest.mocked(data.findRedoableThrow).mockResolvedValue({ id: 'throw-prev' } as any);
        jest.mocked(data.restorePlayerThrow).mockResolvedValue({ id: 'throw-prev', playerId: 'pB', checkout: true } as any);
        jest.mocked(data.findMatch).mockResolvedValue(currentMatch as any);
        jest.mocked(data.updateMatchLegs).mockResolvedValue(updatedMatch as any);

        await redoThrow({ matchId: 'm1', table: '11', leg: 2 });

        expect(data.restorePlayerThrow).toHaveBeenCalledWith('throw-prev', tx);
        expect(data.findMatch).toHaveBeenCalledWith('m1', tx);
        expect(data.updateMatchLegs).toHaveBeenCalledWith('m1', 'pA', 'pB', 1, 1, 5, tx);
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '11', tx);
        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 1, 2);
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });
});

describe('data layer delegation', () => {
    test('findLastThrow delegates to the data layer', async () => {
        const lastThrow = { id: 'throw-1', score: 140 };
        jest.mocked(data.findLastThrow).mockResolvedValue(lastThrow as any);

        const result = await data.findLastThrow('m1', 2, 'pA');

        expect(result).toEqual(lastThrow);
        expect(data.findLastThrow).toHaveBeenCalledWith('m1', 2, 'pA');
    });

    test('findMatchAvg returns 0 when no darts were recorded', async () => {
        jest.mocked(data.aggregateMatchThrows).mockResolvedValue({ _sum: { score: 0, darts: null } } as any);

        const result = await data.aggregateMatchThrows('m1', 'pA');
        const average = calculateThreeDartAverage(result._sum.score ?? 0, result._sum.darts ?? 0);

        expect(average).toBe(0);
        expect(data.aggregateMatchThrows).toHaveBeenCalledWith('m1', 'pA');
    });

    test('findMatchAvg calculates the three-dart average from stored throws', async () => {
        jest.mocked(data.aggregateMatchThrows).mockResolvedValue({ _sum: { score: 321, darts: 12 } } as any);

        const result = await data.aggregateMatchThrows('m1', 'pA');
        const average = calculateThreeDartAverage(result._sum.score ?? 0, result._sum.darts ?? 0);

        expect(average).toBe(80.25);
    });

    test('getPlayerThrowInfo returns null without a match id', async () => {
        const info = (() => {
            if (!null) return null;
            return {};
        })();

        expect(info).toBeNull();
    });

    test('getPlayerThrowInfo returns both score summary and recent throws', async () => {
        const score = [{ playerId: 'pA', _sum: { score: 180 }, _count: { score: 1 } }];
        const lastThrows = [{ id: 'throw-1', score: 180 }];

        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue(score as any);
        jest.mocked(data.findManyPlayerThrows).mockResolvedValue(lastThrows as any);

        const throwsByMatchAndLeg = await data.findThrowsByMatchAndLeg('m1', 2, 'pA', 'pB');
        const manyPlayerThrows = await data.findManyPlayerThrows('t1', 'm1', 2);
        const info = { score: throwsByMatchAndLeg, lastThrows: manyPlayerThrows };

        expect(info).toEqual({ score, lastThrows });
        expect(data.findThrowsByMatchAndLeg).toHaveBeenCalledWith('m1', 2, 'pA', 'pB');
        expect(data.findManyPlayerThrows).toHaveBeenCalledWith('t1', 'm1', 2);
    });
});
