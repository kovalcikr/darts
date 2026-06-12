import type { PrismaClient } from '@/prisma/client';
import prisma from '@/app/lib/db';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { refreshMatchLiveState } from '../../lib/match-live-state/refresh';
import { upsertMatch } from '@/app/lib/data/queries';

const prismaTest = prisma as unknown as PrismaClient;

describe('refreshMatchLiveState', () => {
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

    async function setupMatchWithThrows(throws: Array<{ playerId: string; score: number; darts: number; checkout?: boolean }>) {
        await prismaTest.tournament.create({ data: { id: '1', name: 'Test Tournament' } });
        await upsertMatch({
            matchId: '1',
            tournamentId: '1',
            playerA: { playerId: 'pA', name: 'Player A', image: 'imgA' },
            playerB: { playerId: 'pB', name: 'Player B', image: 'imgB' },
            roundName: 'Round 1',
            raceTo: 5,
        });

        for (let i = 0; i < throws.length; i++) {
            const t = throws[i];
            await prismaTest.playerThrow.create({
                data: {
                    tournamentId: '1',
                    matchId: '1',
                    leg: 1,
                    playerId: t.playerId,
                    score: t.score,
                    darts: t.darts,
                    checkout: t.checkout ?? false,
                    time: new Date(2023, 1, 1, 10, i, 0),
                },
            });
        }
    }

    test('given a match with throws, returns aggregated player scores', async () => {
        await setupMatchWithThrows([
            { playerId: 'pA', score: 100, darts: 3 },
            { playerId: 'pB', score: 50, darts: 3 },
            { playerId: 'pA', score: 60, darts: 2 },
        ]);

        const state = await refreshMatchLiveState('1', '1');

        expect(state).not.toBeNull();
        expect(state!.playerAScoreLeft).toBe(341);
        expect(state!.playerBScoreLeft).toBe(451);
        expect(state!.playerATotalScore).toBe(160);
        expect(state!.playerBTotalScore).toBe(50);
    });

    test('determines active player based on leg and throw count', async () => {
        await setupMatchWithThrows([
            { playerId: 'pA', score: 60, darts: 3 },
            { playerId: 'pB', score: 60, darts: 3 },
        ]);

        await prismaTest.match.update({
            where: { id: '1' },
            data: { firstPlayer: 'pA' },
        });

        const state = await refreshMatchLiveState('1', '1');

        expect(state!.activePlayerId).toBe('pA');
    });

    test('compiles throw history ordered by time descending', async () => {
        await setupMatchWithThrows([
            { playerId: 'pA', score: 100, darts: 3 },
            { playerId: 'pB', score: 50, darts: 3 },
            { playerId: 'pA', score: 180, darts: 3, checkout: true },
        ]);

        const state = await refreshMatchLiveState('1', '1');

        expect(state!.lastThrows).toHaveLength(3);
        expect(state!.lastThrows[0].score).toBe(180);
        expect(state!.lastThrows[1].score).toBe(50);
        expect(state!.lastThrows[2].score).toBe(100);
    });

    test('handles missing match gracefully', async () => {
        const state = await refreshMatchLiveState('nonexistent', '1');

        expect(state).toBeNull();
    });

    test('supports transaction client', async () => {
        await setupMatchWithThrows([
            { playerId: 'pA', score: 100, darts: 3 },
        ]);

        const state = await prismaTest.$transaction(async (tx) => {
            return refreshMatchLiveState('1', '1', tx as any);
        });

        expect(state).not.toBeNull();
        expect(state!.playerAScoreLeft).toBe(401);
    });
});