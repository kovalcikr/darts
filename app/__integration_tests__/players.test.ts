import { PrismaClient } from '@prisma/client';
import prisma from '@/app/lib/db';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { findPlayersByTournament } from '@/app/lib/data';

const prismaTest = prisma as unknown as PrismaClient;

describe('Players Integration Tests', () => {
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
        await prismaTest.tournament.createMany({
            data: [
                { id: '1', name: 'Tournament A' },
                { id: '2', name: 'Tournament B' },
            ]
        });
        await prismaTest.match.createMany({
            data: [
                {
                    id: '1', tournamentId: '1', playerAId: 'pA1', playerAName: 'Player A1', playerAImage: 'imgA1',
                    playerBId: 'pB1', playerBName: 'Player B1', playerBImage: 'imgB1', round: 'R1', runTo: 5
                },
                {
                    id: '2', tournamentId: '1', playerAId: 'pA2', playerAName: 'Player A2', playerAImage: 'imgA2',
                    playerBId: 'pB2', playerBName: 'Player B2', playerBImage: 'imgB2', round: 'R1', runTo: 5
                },
                {
                    id: '3', tournamentId: '2', playerAId: 'pA3', playerAName: 'Player A3', playerAImage: 'imgA3',
                    playerBId: 'pB3', playerBName: 'Player B3', playerBImage: 'imgB3', round: 'R1', runTo: 5
                },
            ]
        });
    }

    test('should find players by tournament', async () => {
        await setupTestData();
        const players = await findPlayersByTournament(['1']);
        expect(players.playersA.length).toBe(2);
        expect(players.playersB.length).toBe(2);
        expect(players.playersA.map(p => p.playerAId)).toContain('pA1');
        expect(players.playersA.map(p => p.playerAId)).toContain('pA2');
    });
});
