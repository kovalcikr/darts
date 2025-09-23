import { PrismaClient } from '@prisma/client';
import prisma from '@/app/lib/db';
import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
    findMatch,
    upsertMatch,
    updateMatchFirstPlayer,
    resetMatchData,
    updateMatchLegs,
    decrementMatchLegs,
} from '@/app/lib/data';

const prismaTest = prisma as unknown as PrismaClient;

describe('Match Integration Tests', () => {
    beforeEach(async () => {
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

    const tournament = {
        id: '1',
        name: 'Test Tournament',
    };

    const matchData = {
        matchId: '1',
        tournamentId: '1',
        playerA: { playerId: 'pA', name: 'Player A', image: 'imgA' },
        playerB: { playerId: 'pB', name: 'Player B', image: 'imgB' },
        roundName: 'Round 1',
        raceTo: 5,
    };

    async function setupTestData() {
        await prismaTest.tournament.create({ data: tournament });
        await upsertMatch(matchData);
    }

    test('should upsert a match', async () => {
        await prismaTest.tournament.create({ data: tournament });

        // Create
        await upsertMatch(matchData);
        let match = await findMatch(matchData.matchId);
        expect(match).not.toBeNull();
        expect(match?.playerAName).toBe('Player A');

        // Update
        const updatedMatchData = { ...matchData, playerA: { ...matchData.playerA, name: 'Player A Updated' } };
        await upsertMatch(updatedMatchData);
        match = await findMatch(matchData.matchId);
        expect(match).not.toBeNull();
        expect(match?.playerAName).toBe('Player A Updated');
    });

    test('should update match first player', async () => {
        await setupTestData();
        await updateMatchFirstPlayer(matchData.matchId, 'pA');
        const match = await findMatch(matchData.matchId);
        expect(match?.firstPlayer).toBe('pA');
    });

    test('should reset match data', async () => {
        await setupTestData();
        await updateMatchFirstPlayer(matchData.matchId, 'pA');
        await prismaTest.match.update({
            where: { id: matchData.matchId },
            data: { playerALegs: 2, playerBlegs: 1 }
        });

        await resetMatchData(matchData.matchId);
        const match = await findMatch(matchData.matchId);
        expect(match?.firstPlayer).toBeNull();
        expect(match?.playerALegs).toBe(0);
        expect(match?.playerBlegs).toBe(0);
    });

    test('should update match legs', async () => {
        await setupTestData();
        await updateMatchLegs(matchData.matchId, 'pA', 'pA', 0, 0);
        let match = await findMatch(matchData.matchId);
        expect(match?.playerALegs).toBe(1);

        await updateMatchLegs(matchData.matchId, 'pA', 'pB', 1, 0);
        match = await findMatch(matchData.matchId);
        expect(match?.playerBlegs).toBe(1);
    });

    test('should decrement match legs', async () => {
        await setupTestData();
        await prismaTest.match.update({
            where: { id: matchData.matchId },
            data: { playerALegs: 2, playerBlegs: 1 }
        });

        await decrementMatchLegs(matchData.matchId, 'pA', 'pA', 2, 1);
        let match = await findMatch(matchData.matchId);
        expect(match?.playerALegs).toBe(1);

        await decrementMatchLegs(matchData.matchId, 'pA', 'pB', match!.playerALegs, match!.playerBlegs);
        match = await findMatch(matchData.matchId);
        expect(match?.playerBlegs).toBe(0);
    });
});
