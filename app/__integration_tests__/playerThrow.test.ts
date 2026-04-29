import type { PrismaClient } from '@/prisma/client';
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
    findHighestScoreInMatch,
    findBestCheckoutInMatch,
    findBestLegInMatch,
    findThrowsByMatch,
    findMatchesByTournament,
    findRedoableThrow,
    findScoreboardThrowHistory,
    invalidateRedoableThrows,
    markPlayerThrowUndone,
    restorePlayerThrow,
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

    test('should soft-undo and restore a throw without counting it while undone', async () => {
        await setupTestData();
        const lastThrow = await findLastThrow('1', 1);

        await markPlayerThrowUndone(lastThrow!.id);

        const aggregatedWhileUndone = await aggregatePlayerThrow('1', 1, 'pA');
        expect(aggregatedWhileUndone._sum.score).toBe(100);
        expect(await findLastThrow('1', 1)).toMatchObject({ score: 50 });

        const redoableThrow = await findRedoableThrow('1');
        expect(redoableThrow?.id).toBe(lastThrow!.id);

        await restorePlayerThrow(redoableThrow!.id);

        const aggregatedAfterRedo = await aggregatePlayerThrow('1', 1, 'pA');
        expect(aggregatedAfterRedo._sum.score).toBe(240);
        expect(await findLastThrow('1', 1)).toMatchObject({ score: 140 });
    });

    test('should invalidate redoable throws after new scoring continues', async () => {
        await setupTestData();
        const lastThrow = await findLastThrow('1', 1);
        await markPlayerThrowUndone(lastThrow!.id);

        expect(await findRedoableThrow('1')).toMatchObject({ id: lastThrow!.id });

        await invalidateRedoableThrows('1');

        expect(await findRedoableThrow('1')).toBeNull();
    });

    test('should expose active and undo stack throws for the scoreboard history', async () => {
        await setupTestData();
        const lastThrow = await findLastThrow('1', 1);
        await markPlayerThrowUndone(lastThrow!.id);

        const history = await findScoreboardThrowHistory('1', 6);

        expect(history[0]).toMatchObject({
            id: lastThrow!.id,
            status: 'undone',
            score: 140,
        });
        expect(history.some(playerThrow => playerThrow.status === 'active' && playerThrow.score === 60)).toBe(true);
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

    test('should find highest score and best checkout in a match', async () => {
        await setupTestData();
        await prismaTest.playerThrow.createMany({
            data: [
                { tournamentId: '1', matchId: '1', leg: 2, playerId: 'pA', score: 161, darts: 3, checkout: true, time: new Date(2023, 1, 1, 10, 4, 0) },
                { tournamentId: '1', matchId: '1', leg: 2, playerId: 'pB', score: 180, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 5, 0) },
            ],
        });

        expect(await findHighestScoreInMatch('1', 'pB')).toBe(180);
        expect(await findBestCheckoutInMatch('1', 'pA')).toBe(161);
        expect(await findBestCheckoutInMatch('1', 'pB')).toBe(0);
    });

    test('should find the best leg among the legs won by a player', async () => {
        await setupTestData();
        await prismaTest.playerThrow.createMany({
            data: [
                { tournamentId: '1', matchId: '1', leg: 2, playerId: 'pA', score: 180, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 4, 0) },
                { tournamentId: '1', matchId: '1', leg: 2, playerId: 'pA', score: 160, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 5, 0) },
                { tournamentId: '1', matchId: '1', leg: 2, playerId: 'pA', score: 161, darts: 3, checkout: true, time: new Date(2023, 1, 1, 10, 6, 0) },
                { tournamentId: '1', matchId: '1', leg: 3, playerId: 'pA', score: 100, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 7, 0) },
                { tournamentId: '1', matchId: '1', leg: 3, playerId: 'pA', score: 100, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 8, 0) },
                { tournamentId: '1', matchId: '1', leg: 3, playerId: 'pA', score: 100, darts: 3, checkout: false, time: new Date(2023, 1, 1, 10, 9, 0) },
                { tournamentId: '1', matchId: '1', leg: 3, playerId: 'pA', score: 201, darts: 3, checkout: true, time: new Date(2023, 1, 1, 10, 10, 0) },
            ],
        });

        const bestLeg = await findBestLegInMatch('1', 'pA');

        expect(bestLeg).toBe(9);
    });

    test('should find throws by match ordered by time', async () => {
        await setupTestData();

        const throws = await findThrowsByMatch('1');

        expect(throws.map(playerThrow => playerThrow.score)).toEqual([100, 50, 140, 60]);
    });

    test('should find matches by tournament', async () => {
        await setupTestData();
        await prismaTest.match.create({
            data: {
                id: '2',
                tournamentId: '1',
                playerAId: 'pA2',
                playerAName: 'Player A2',
                playerAImage: 'imgA2',
                playerBId: 'pB2',
                playerBName: 'Player B2',
                playerBImage: 'imgB2',
                round: 'Round 2',
                runTo: 5,
            },
        });

        const matches = await findMatchesByTournament('1');

        expect(matches).toHaveLength(2);
        expect(matches.map(match => match.id)).toEqual(expect.arrayContaining(['1', '2']));
    });
});
