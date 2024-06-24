import {describe, expect, test} from '@jest/globals';
import { getCuescoreMatch, getMatch, getThrows } from '../lib/match';
import exp from 'constants';
import prisma from '../lib/db';

describe('match test', () => {
    test('get cuescore match', async () => {
        const tournamentId = '43951255';
        const tableName = '1';
        const match = await getCuescoreMatch(tournamentId, tableName);
        console.log(match);
        expect(match.matchstatus).toBe('playing');
    });

    test('get non existing match', async () => {
        const match = await getMatch("12345");
        expect(match).toBeNull;
    })
})

describe('throws test', () => {
    test('get throws', async() => {
        await prisma.tournament.deleteMany();
        await prisma.match.deleteMany();
        await prisma.playerThrow.deleteMany();

        const tournament = await prisma.tournament.create({
            data: {
                name: "test Tournament"
            }
        });

        const match = await prisma.match.create({
            data: {
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
        })

        await prisma.playerThrow.create({
            data: {
                tournamentId: "test123",
                matchId: match.id,
                leg: 1,
                playerId: 'A',
                score: 100,
            }
        });

        await prisma.playerThrow.create({
            data: {
                tournamentId: "test123",
                matchId: match.id,
                leg: 1,
                playerId: 'B',
                score: 10,
            }
        });
        
        await prisma.playerThrow.create({
            data: {
                tournamentId: "test123",
                matchId: match.id,
                leg: 1,
                playerId: 'C',
                score: 50,
            }
        });

        await prisma.playerThrow.create({
            data: {
                tournamentId: "test123",
                matchId: match.id,
                leg: 1,
                playerId: 'A',
                score: 40,
            }
        });

        await prisma.playerThrow.create({
            data: {
                tournamentId: "test123",
                matchId: match.id,
                leg: 2,
                playerId: 'A',
                score: 37,
            }
        });

        const playerThrows = await getThrows(match.id, 1, "A", "B");

        console.log(playerThrows)

    })
})