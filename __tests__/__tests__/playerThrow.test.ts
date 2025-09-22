import {describe, expect, test, jest, beforeEach, afterEach} from '@jest/globals';
import prisma from '../../app/lib/db';
import { findLastThrow, findMatchAvg, addThrowAction } from '../../app/lib/playerThrow';
import { setScore } from '../../app/lib/cuescore';

jest.mock('../../app/lib/cuescore');
jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

const mockedSetScore = setScore as jest.MockedFunction<typeof setScore>;

describe('playerThrow', () => {
    beforeEach(async () => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();

        await prisma.tournament.create({
            data: { id: "test-tournament", name: "test Tournament" }
        });

        await prisma.match.create({
            data: {
                id: "test-match",
                tournamentId: "test-tournament",
                playerAId: "A",
                playerAImage: "a url",
                playerAName: "A name",
                playerBId: "B",
                playerBImage: "b url",
                playerBName: "B name",
                round: "1",
                runTo: 3
            }
        });

        await prisma.playerThrow.create({
            data: { tournamentId: "test-tournament", matchId: "test-match", leg: 1, playerId: 'A', score: 100 }
        });
        await prisma.playerThrow.create({
            data: { tournamentId: "test-tournament", matchId: "test-match", leg: 1, playerId: 'A', score: 140 }
        });
        await prisma.playerThrow.create({
            data: { tournamentId: "test-tournament", matchId: "test-match", leg: 1, playerId: 'B', score: 10 }
        });
    });

    afterEach(async () => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();
    });

    describe('findLastThrow', () => {
        test('should return the last throw for a player in a leg', async () => {
            const lastThrow = await findLastThrow("test-match", 1, "A");
            expect(lastThrow.score).toBe(140);
        });

        test('should return null if the player has no throws in the leg', async () => {
            const lastThrow = await findLastThrow("test-match", 2, "A");
            expect(lastThrow).toBeNull();
        });
    });

    describe('findMatchAvg', () => {
        test('should calculate the correct match average for a player', async () => {
            const avg = await findMatchAvg("test-match", "A");
            // (100 + 140) / (3 + 3) darts = 40 avg per dart. 40 * 3 = 120 avg per 3 darts
            expect(avg).toBe(120);
        });

        test('should return 0 if the player has no throws', async () => {
            const avg = await findMatchAvg("test-match", "C");
            expect(avg).toBe(0);
        });
    });

    describe('addThrowAction', () => {
        test('should add a new throw', async () => {
            await addThrowAction("test-tournament", "test-match", 1, "A", 60, 3, false, "1");
            const throws = await prisma.playerThrow.findMany({ where: { playerId: 'A' } });
            expect(throws.length).toBe(3);
            expect(throws[2].score).toBe(60);
        });

        test('should throw an error when the score is a bust', async () => {
            await expect(addThrowAction("test-tournament", "test-match", 1, "A", 300, 3, false, "1")).rejects.toThrow('Bust');
        });

        test('should close the leg when the score is exactly 501', async () => {
            await addThrowAction("test-tournament", "test-match", 1, "A", 261, 3, false, "1");
            const match = await prisma.match.findUnique({ where: { id: 'test-match' } });
            expect(match.playerALegs).toBe(1);
        });
    });
});
