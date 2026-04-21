import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { revalidatePath, revalidateTag } from 'next/cache';
import { setScore } from '../lib/cuescore';
import {
    addThrowAction,
    findLastThrow,
    findMatchAvg,
    getPlayerThrowInfo,
    undoThrow,
} from '../lib/playerThrow';
import * as data from '../lib/data';
import { prismaMock } from './mocks';

jest.mock('../lib/data');
jest.mock('../lib/cuescore', () => ({
    setScore: jest.fn(),
}));
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

describe('playerThrow', () => {
    const tx = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
        (prismaMock.$transaction as any).mockImplementation(async (callback: any) => callback(tx));
    });

    test('addThrowAction stores a normal throw and revalidates the table', async () => {
        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 180 } } as any);

        await addThrowAction('t1', 'm1', 1, 'pA', 100, 3, false, '11');

        expect(data.aggregatePlayerThrow).toHaveBeenCalledWith('m1', 1, 'pA', tx);
        expect(data.createPlayerThrow).toHaveBeenCalledWith('t1', 'm1', 1, 'pA', 100, 3, false, tx);
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(data.updateMatchLegs).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith('/tournaments/[id]/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('addThrowAction closes the leg and syncs the updated score', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
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

        await addThrowAction('t1', 'm1', 2, 'pA', 60, 2, false, '11');

        expect(data.createPlayerThrow).toHaveBeenCalledWith('t1', 'm1', 2, 'pA', 60, 2, true, tx);
        expect(data.findMatch).toHaveBeenCalledWith('m1', tx);
        expect(data.updateMatchLegs).toHaveBeenCalledWith('m1', 'pA', 'pA', 1, 1, tx);
        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 2, 1);
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('addThrowAction rejects bust scores without mutating state', async () => {
        jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 500 } } as any);

        await expect(addThrowAction('t1', 'm1', 1, 'pA', 2, 1, false, '11')).rejects.toThrow('Bust');

        expect(data.createPlayerThrow).not.toHaveBeenCalled();
        expect(data.findMatch).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).not.toHaveBeenCalled();
        expect(revalidateTag).not.toHaveBeenCalled();
    });

    test('undoThrow removes the latest throw in the current leg', async () => {
        jest.mocked(data.findLastThrow).mockResolvedValue({ id: 'throw-1' } as any);

        await undoThrow('m1', 2, false, '11');

        expect(data.findLastThrow).toHaveBeenCalledWith('m1', 2, undefined, tx);
        expect(data.deletePlayerThrow).toHaveBeenCalledWith('throw-1', tx);
        expect(data.findPreviousLegLastThrow).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidatePath).toHaveBeenCalledWith('/tournaments/[id]/tables/[table]', 'page');
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('undoThrow reopens the previous leg when the current leg is empty', async () => {
        const currentMatch = {
            id: 'm1',
            tournamentId: 't1',
            playerAId: 'pA',
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

        await undoThrow('m1', 3, false, '11');

        expect(data.deletePlayerThrow).toHaveBeenCalledWith('throw-prev', tx);
        expect(data.findMatch).toHaveBeenCalledWith('m1', tx);
        expect(data.decrementMatchLegs).toHaveBeenCalledWith('m1', 'pA', 'pB', 1, 2, tx);
        expect(setScore).toHaveBeenCalledWith('t1', 'm1', 1, 1);
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('undoThrow resets the starting player when no throws exist yet', async () => {
        jest.mocked(data.findLastThrow).mockResolvedValue(null);
        jest.mocked(data.findPreviousLegLastThrow).mockResolvedValue(null);

        await undoThrow('m1', 1, false, '11');

        expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', null, tx);
        expect(data.deletePlayerThrow).not.toHaveBeenCalled();
        expect(data.decrementMatchLegs).not.toHaveBeenCalled();
        expect(setScore).not.toHaveBeenCalled();
        expect(revalidateTag).toHaveBeenCalledWith('match11', 'max');
    });

    test('findLastThrow delegates to the data layer', async () => {
        const lastThrow = { id: 'throw-1', score: 140 };
        jest.mocked(data.findLastThrow).mockResolvedValue(lastThrow as any);

        const result = await findLastThrow('m1', 2, 'pA');

        expect(result).toEqual(lastThrow);
        expect(data.findLastThrow).toHaveBeenCalledWith('m1', 2, 'pA');
    });

    test('findMatchAvg returns 0 when no darts were recorded', async () => {
        jest.mocked(data.aggregateMatchThrows).mockResolvedValue({ _sum: { score: 0, darts: null } } as any);

        const average = await findMatchAvg('m1', 'pA');

        expect(average).toBe(0);
        expect(data.aggregateMatchThrows).toHaveBeenCalledWith('m1', 'pA');
    });

    test('findMatchAvg calculates the three-dart average from stored throws', async () => {
        jest.mocked(data.aggregateMatchThrows).mockResolvedValue({ _sum: { score: 321, darts: 12 } } as any);

        const average = await findMatchAvg('m1', 'pA');

        expect(average).toBe(80.25);
    });

    test('getPlayerThrowInfo returns null without a match id', async () => {
        const info = await getPlayerThrowInfo('t1', null, 1, 'pA', 'pB');

        expect(info).toBeNull();
        expect(data.findThrowsByMatchAndLeg).not.toHaveBeenCalled();
        expect(data.findManyPlayerThrows).not.toHaveBeenCalled();
    });

    test('getPlayerThrowInfo returns both score summary and recent throws', async () => {
        const score = [{ playerId: 'pA', _sum: { score: 180 }, _count: { score: 1 } }];
        const lastThrows = [{ id: 'throw-1', score: 180 }];

        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue(score as any);
        jest.mocked(data.findManyPlayerThrows).mockResolvedValue(lastThrows as any);

        const info = await getPlayerThrowInfo('t1', 'm1', 2, 'pA', 'pB');

        expect(info).toEqual({ score, lastThrows });
        expect(data.findThrowsByMatchAndLeg).toHaveBeenCalledWith('m1', 2, 'pA', 'pB');
        expect(data.findManyPlayerThrows).toHaveBeenCalledWith('t1', 'm1', 2);
    });
});
