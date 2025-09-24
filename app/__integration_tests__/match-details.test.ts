import { test, expect, describe, beforeAll } from '@jest/globals';
import { prisma } from '@/lib/db';
import { getFullMatch } from '@/lib/match';

describe('Match Details Integration Test', () => {
    let tournament;
    let player1;
    let player2;
    let match;

    beforeAll(async () => {
        tournament = await prisma.tournament.create({
            data: {
                id: 'test-tournament-match-details-2',
                name: 'Test Tournament 2',
                date: new Date(),
            },
        });

        player1 = await prisma.player.create({
            data: {
                id: 'test-player-1-match-details-2',
                name: 'Player 1',
                photo: 'https://example.com/player1.jpg',
            },
        });

        player2 = await prisma.player.create({
            data: {
                id: 'test-player-2-match-details-2',
                name: 'Player 2',
                photo: 'https://example.com/player2.jpg',
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
                raceTo: 2,
                round: 'Final',
            },
        });

        await prisma.playerThrow.createMany({
            data: [
                { id: 'throw-11-md', value: 60, double: false, leg: 1, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-12-md', value: 50, double: false, leg: 1, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-13-md', value: 100, double: false, leg: 1, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-14-md', value: 101, double: false, leg: 1, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-15-md', value: 141, double: true, leg: 1, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, checkout: true, darts: 3 },
                { id: 'throw-16-md', value: 60, double: false, leg: 2, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-17-md', value: 50, double: false, leg: 2, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-18-md', value: 100, double: false, leg: 2, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-19-md', value: 101, double: false, leg: 2, playerId: player1.id, matchId: match.id, tournamentId: tournament.id, darts: 3 },
                { id: 'throw-20-md', value: 141, double: true, leg: 2, playerId: player2.id, matchId: match.id, tournamentId: tournament.id, checkout: true, darts: 3 },
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

    test('should return full match details', async () => {
        const fullMatch = await getFullMatch(match.id, false);

        expect(fullMatch).toBeDefined();
        expect(fullMatch.id).toBe(match.id);
        expect(fullMatch.playerA.name).toBe(player1.name);
        expect(fullMatch.playerB.name).toBe(player2.name);
        expect(fullMatch.playerA.legCount).toBe(1);
        expect(fullMatch.playerB.legCount).toBe(1);
        expect(fullMatch.throws.length).toBe(10);
        expect(fullMatch.playerA.matchAvg).toBeCloseTo(100.33);
        expect(fullMatch.playerB.matchAvg).toBeCloseTo(100.33);
        expect(fullMatch.playerA.bestCheckout).toBe(141);
        expect(fullMatch.playerB.bestCheckout).toBe(141);
    });
});
