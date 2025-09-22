import {describe, expect, test, jest, afterEach, beforeEach} from '@jest/globals';
import { getCuescoreMatch, getMatch, getThrows } from '../../app/lib/match';
import prisma from '../../app/lib/db';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('match test', () => {
    beforeEach(async () => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();
    });

    afterEach(async () => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();
    });

    test('get cuescore match', async () => {
        const tournamentId = '43951255';
        const tableName = '1';
        const mockData = { matches: [{ matchstatus: 'playing', table: { name: '1' } }] };
        mockedAxios.get.mockResolvedValue({ data: mockData });

        const match = await getCuescoreMatch(tournamentId, tableName);
        expect(match.matchstatus).toBe('playing');
    });

    test('get non existing match', async () => {
        const match = await getMatch("12345");
        expect(match).toBeNull();
    });
});

describe('throws test', () => {
    beforeEach(async () => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();
    });

    afterEach(async () => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();
    });

    test('get throws for a leg', async() => {
        const tournament = await prisma.tournament.create({
            data: { id: "test-tournament", name: "test Tournament" }
        });

        const match = await prisma.match.create({
            data: {
                id: "test-match",
                tournamentId: tournament.id,
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
            data: { tournamentId: tournament.id, matchId: match.id, leg: 1, playerId: 'A', score: 100 }
        });
        await prisma.playerThrow.create({
            data: { tournamentId: tournament.id, matchId: match.id, leg: 1, playerId: 'B', score: 10 }
        });
        await prisma.playerThrow.create({
            data: { tournamentId: tournament.id, matchId: match.id, leg: 2, playerId: 'A', score: 40 }
        });

        const playerThrows = await getThrows(match.id, 1, "A", "B");
        expect(playerThrows.length).toBe(2);

        const playerAThrows = playerThrows.find(t => t.playerId === "A");
        const playerBThrows = playerThrows.find(t => t.playerId === "B");

        expect(playerAThrows._sum.score).toBe(100);
        expect(playerBThrows._sum.score).toBe(10);
    });
});