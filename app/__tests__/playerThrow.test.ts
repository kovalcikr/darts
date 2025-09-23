import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import * as playerThrow from '../lib/playerThrow';
import { setScore } from '../lib/cuescore';
import { Match, PlayerThrow } from '@prisma/client';
import * as data from '../lib/data';

jest.mock('../lib/cuescore', () => ({
    setScore: jest.fn(),
}));

jest.mock('../lib/data');
jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

const mockMatch: Match = {
    id: 'm1',
    round: 'r1',
    playerAId: 'p1',
    playerAName: 'Player A',
    playerAImage: 'imgA',
    playerBId: 'p2',
    playerBName: 'Player B',
    playerBImage: 'imgB',
    runTo: 5,
    playerALegs: 0,
    playerBlegs: 0,
    firstPlayer: 'p1',
    tournamentId: 't1',
};

const mockPlayerThrow: PlayerThrow = {
    id: 'th1',
    tournamentId: 't1',
    matchId: 'm1',
    leg: 1,
    playerId: 'p1',
    time: new Date(),
    score: 50,
    darts: 3,
    doubles: null,
    checkout: false,
};


describe('playerThrow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addThrowAction', () => {
        test('should add a throw and not close the leg', async () => {
            jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 100 } } as any);
            jest.mocked(data.createPlayerThrow).mockResolvedValue(null);
            await playerThrow.addThrowAction('t1', 'm1', 1, 'p1', 50, 3, false, 'table1');
            expect(data.createPlayerThrow).toHaveBeenCalled();
            expect(setScore).not.toHaveBeenCalled();
        });

        test('should throw bust error', async () => {
            jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 460 } } as any);
            await expect(playerThrow.addThrowAction('t1', 'm1', 1, 'p1', 50, 3, false, 'table1')).rejects.toThrow('Bust');
        });

        test('should close the leg', async () => {
            jest.mocked(data.aggregatePlayerThrow).mockResolvedValue({ _sum: { score: 451 } } as any);
            jest.mocked(data.createPlayerThrow).mockResolvedValue(null);
            jest.mocked(data.findMatch).mockResolvedValue(mockMatch as any);
            jest.mocked(data.updateMatchLegs).mockResolvedValue({ ...mockMatch, playerALegs: 1 } as any);

            await playerThrow.addThrowAction('t1', 'm1', 1, 'p1', 50, 3, false, 'table1');

            expect(data.createPlayerThrow).toHaveBeenCalledWith('t1', 'm1', 1, 'p1', 50, 3, true);
            expect(data.updateMatchLegs).toHaveBeenCalled();
            expect(setScore).toHaveBeenCalled();
        });
    });

    describe('undoThrow', () => {
        test('should undo a regular throw', async () => {
            jest.mocked(data.findLastThrow).mockResolvedValue(mockPlayerThrow);
            jest.mocked(data.deletePlayerThrow).mockResolvedValue(null);
            await playerThrow.undoThrow('m1', 1, false, 'table1');
            expect(data.deletePlayerThrow).toHaveBeenCalledWith('th1');
            expect(setScore).not.toHaveBeenCalled();
        });

        test('should undo a leg-closing throw', async () => {
            jest.mocked(data.findLastThrow).mockResolvedValue(null);
            jest.mocked(data.findPreviousLegLastThrow).mockResolvedValue(mockPlayerThrow);
            jest.mocked(data.deletePlayerThrow).mockResolvedValue(null);
            jest.mocked(data.findMatch).mockResolvedValue(mockMatch as any);
            jest.mocked(data.decrementMatchLegs).mockResolvedValue({ ...mockMatch, playerALegs: 0 } as any);

            await playerThrow.undoThrow('m1', 1, false, 'table1');

            expect(data.deletePlayerThrow).toHaveBeenCalledWith('th1');
            expect(data.decrementMatchLegs).toHaveBeenCalled();
            expect(setScore).toHaveBeenCalled();
        });
    });


    test('findLastThrow', async () => {
        jest.mocked(data.findLastThrow).mockResolvedValue(mockPlayerThrow);
        await playerThrow.findLastThrow('m1', 1, 'p1');
        expect(data.findLastThrow).toHaveBeenCalledWith('m1', 1, 'p1');
    });

    test('findMatchAvg', async () => {
        jest.mocked(data.aggregateMatchThrows).mockResolvedValue({ _sum: { score: 1000, darts: 30 } } as any);
        const avg = await playerThrow.findMatchAvg('m1', 'p1');
        expect(avg).toBe(100);
    });

    test('getPlayerThrowInfo', async () => {
        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue([]);
        jest.mocked(data.findManyPlayerThrows).mockResolvedValue([]);
        await playerThrow.getPlayerThrowInfo('t1', 'm1', 1, 'pA', 'pB');
        expect(data.findThrowsByMatchAndLeg).toHaveBeenCalled();
        expect(data.findManyPlayerThrows).toHaveBeenCalled();
    });
});
