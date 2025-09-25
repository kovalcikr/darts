import { PrismaClient } from '@prisma/client';
import prisma from '@/app/lib/db';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
    findThrowsByMatchAndLeg,
    aggregatePlayerThrow,
    createPlayerThrow,
    findLastThrow,
    deletePlayerThrow,
    findPreviousLegLastThrow,
    aggregateMatchThrows,
    findManyPlayerThrows,
} from '@/app/lib/data';

const prismaTest = prisma as unknown as PrismaClient;

describe('Player Throw Integration Tests', () => {
    beforeAll(async () => {
        await prismaTest.playerThrow.deleteMany();
        await prismaTest.match.deleteMany();
        await prismaTest.tournament.deleteMany();
    });

    beforeEach(async () => {
        await prismaTest.playerThrow.deleteMany();
        await prismaTest.match.deleteMany();
        await prismaTest.tournament.deleteMany();
    });

    afterEach(async () => {
        await prismaTest.playerThrow.deleteMany();
        await prismaTest.match.deleteMany();
        await prismaTest.tournament.deleteMany();
    });

    afterAll(async () => {
        await prismaTest.playerThrow.deleteMany();
        await prismaTest.match.deleteMany();
        await prismaTest.tournament.deleteMany();
        await prismaTest.$disconnect();
    });

    async function setupTestData() {
        await prismaTest.tournament.upsert({
            where: { id: '1' },
            update: {},
            create: { id: '1', name: 'Test Tournament' },
        });
        await prismaTest.match.upsert({
            where: { id: '1' },
            update: {},
            create: {
                id: '1',
                tournamentId: '1',
                playerAId: 'pA',
                playerAName: 'Player A',
                playerAImage: 'imgA',
                playerBId: 'pB',
                playerBName: 'Player B',
                playerBImage: 'imgB',
                round: 'Round 1',
                runTo: 5,
            },
        });
        await prismaTest.playerThrow.createMany({
            data: [
                { tournamentId: '1', matchId: '1', leg: 1, playerId: 'pA', score: 100, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 0, 0) },
                { tournamentId: '1', matchId: '1', leg: 1, playerId: 'pB', score: 50, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 1, 0) },
                { tournamentId: '1', matchId: '1', leg: 1, playerId: 'pA', score: 140, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 2, 0) },
                { tournamentId: '1', matchId: '1', leg: 2, playerId: 'pB', score: 60, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 3, 0) },
            ]
        });
    }

    test('should find throws by match and leg', async () => {
        await setupTestData();
        const throws = await findThrowsByMatchAndLeg('1', 1, 'pA', 'pB');
        expect(throws.length).toBe(2);
    });

    test('should aggregate player throw', async () => {
        await setupTestData();
        const aggregated = await aggregatePlayerThrow('1', 1, 'pA');
        expect(aggregated._sum.score).toBe(240);
    });

    test('should create a player throw', async () => {
        await setupTestData();
        await createPlayerThrow('1', '1', 3, 'pA', 180, 3, true);
        const throws = await prismaTest.playerThrow.findMany({ where: { leg: 3 } });
        expect(throws.length).toBe(1);
        expect(throws[0].score).toBe(180);
    });

    test('should find last throw', async () => {
        await setupTestData();
        const lastThrow = await findLastThrow('1', 1);
        expect(lastThrow?.score).toBe(140);
    });

    test('should delete a player throw', async () => {
        await setupTestData();
        const lastThrow = await findLastThrow('1', 1);
        await deletePlayerThrow(lastThrow!.id);
        const throws = await prismaTest.playerThrow.findMany({ where: { leg: 1 } });
        expect(throws.length).toBe(2);
    });

    test('should find previous leg last throw', async () => {
        await setupTestData();
        const lastThrow = await findPreviousLegLastThrow('1', 2);
        expect(lastThrow?.score).toBe(140);
    });

    test('should aggregate match throws', async () => {
        await setupTestData();
        const aggregated = await aggregateMatchThrows('1', 'pA');
        expect(aggregated._sum.score).toBe(240);
        expect(aggregated._sum.darts).toBe(6);
    });

    test('should find many player throws', async () => {
        await setupTestData();
        const throws = await findManyPlayerThrows('1', '1', 1);
        expect(throws.length).toBe(3);
    });
});
