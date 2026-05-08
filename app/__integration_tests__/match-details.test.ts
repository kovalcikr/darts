import { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import prisma from '../lib/db';
import { getMatchDetails } from '../lib/match';

describe('Match Details Integration Test', () => {
    let tournament;
    let match;
    const player1 = {
        id: 'test-player-1-match-details-2',
        name: 'Player 1',
        photo: 'https://example.com/player1.jpg',
    };
    const player2 = {
        id: 'test-player-2-match-details-2',
        name: 'Player 2',
        photo: 'https://example.com/player2.jpg',
    };


    beforeAll(async () => {
        await prisma.playerThrow.deleteMany();
        await prisma.match.deleteMany();
        await prisma.tournament.deleteMany();
    });

    beforeEach(async () => {
        await prisma.playerThrow.deleteMany();
        await prisma.match.deleteMany();
        await prisma.tournament.deleteMany();

        tournament = await prisma.tournament.create({
            data: {
                id: 'test-tournament-match-details-2',
                name: 'Test Tournament 2',
            },
        });

        match = await prisma.match.create({
            data: {
                id: 'test-match-match-details-2',
                tournamentId: tournament.id,
                playerAId: player1.id,
                playerBId: player2.id,
                playerAName: player1.name,
                playerBName: player2.name,
                playerAImage: player1.photo,
                playerBImage: player2.photo,
                runTo: 2,
                round: 'Final',
            },
        });

        await prisma.playerThrow.createMany({
            data: [
                { id: 'throw-11-md', score: 60, leg: 1, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-12-md', score: 50, leg: 1, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-13-md', score: 100, leg: 1, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-14-md', score: 101, leg: 1, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-15-md', score: 141, leg: 1, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, checkout: true, darts: 3 },
                { id: 'throw-16-md', score: 60, leg: 2, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-17-md', score: 50, leg: 2, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-18-md', score: 100, leg: 2, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-19-md', score: 101, leg: 2, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-20-md', score: 140, leg: 2, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, checkout: true, darts: 3 },
            ],
        });

        await prisma.match.update({
            where: { id: match.id },
            data: {
                playerALegs: 1,
                playerBlegs: 1,
            }
        });
    });

    afterEach(async () => {
        await prisma.playerThrow.deleteMany();
        await prisma.match.deleteMany();
        await prisma.tournament.deleteMany();
    });

    afterAll(async () => {
        await prisma.playerThrow.deleteMany();
        await prisma.match.deleteMany();
        await prisma.tournament.deleteMany();
        await prisma.$disconnect();
    });

    test('should return full match details', async () => {
        const data = await getMatchDetails(match.id);

        expect(data).toBeDefined();
        expect(data.match.id).toBe(match.id);
        expect(data.playerA.name).toBe(player1.name);
        expect(data.playerB.name).toBe(player2.name);
        expect(data.playerA.legCount).toBe(1);
        expect(data.playerB.legCount).toBe(1);
        expect(data.throws.length).toBe(10);
        expect(data.playerA.matchAvg).toBeCloseTo(90.4);
        expect(data.playerB.matchAvg).toBeCloseTo(90.2);
        expect(data.playerA.bestCheckout).toBe(141);
        expect(data.playerB.bestCheckout).toBe(140);
        expect(data.playerA.bestLeg).toBe(9);
        expect(data.playerB.bestLeg).toBe(9);
    });

    test('should return 0 for best leg if player has not won any legs', async () => {
        await prisma.playerThrow.deleteMany();
        await prisma.match.deleteMany();

        const matchWithoutWin = await prisma.match.create({
            data: {
                id: 'test-match-no-win-2',
                tournamentId: tournament.id,
                playerAId: player1.id,
                playerBId: player2.id,
                playerAName: player1.name,
                playerBName: player2.name,
                playerAImage: player1.photo,
                playerBImage: player2.photo,
                runTo: 2,
                round: 'Final',
                playerBlegs: 1,
            },
        });

        await prisma.playerThrow.createMany({
            data: [
                { id: 'throw-nw-1', darts: 3, leg: 1, playerId: player1.id, matchId: matchWithoutWin.id, tournamentId: tournament.id, score: 100 },
                { id: 'throw-nw-2', darts: 3, leg: 1, playerId: player2.id, matchId: matchWithoutWin.id, tournamentId: tournament.id, score: 100 },
                { id: 'throw-nw-3', darts: 3, leg: 1, playerId: player1.id, matchId: matchWithoutWin.id, tournamentId: tournament.id, score: 100 },
                { id: 'throw-nw-4', darts: 3, leg: 1, playerId: player2.id, matchId: matchWithoutWin.id, tournamentId: tournament.id, score: 301, checkout: true },
            ],
        });

        const data = await getMatchDetails(matchWithoutWin.id);

        expect(data.playerA.bestLeg).toBe(0);
        expect(data.playerB.bestLeg).toBe(6);
    });
});
