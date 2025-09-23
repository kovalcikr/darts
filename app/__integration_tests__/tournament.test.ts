import { PrismaClient } from '@prisma/client';
import prisma from '@/app/lib/db';
import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { upsertTournament, findTournamentsByName, findTournamentsByYear } from '@/app/lib/data';

const prismaTest = prisma as unknown as PrismaClient;

describe('Tournament Integration Tests', () => {
    beforeEach(async () => {
        await prismaTest.tournament.deleteMany();
    });

    afterAll(async () => {
        await prismaTest.tournament.deleteMany();
        await prismaTest.$disconnect();
    });

    test('should upsert a tournament', async () => {
        const tournamentId = '1';
        const tournamentName = 'Test Tournament';

        // Create
        await upsertTournament(tournamentId, tournamentName);
        let tournament = await prismaTest.tournament.findUnique({ where: { id: tournamentId } });
        expect(tournament).not.toBeNull();
        expect(tournament?.name).toBe(tournamentName);

        // Update
        const updatedTournamentName = 'Updated Test Tournament';
        await upsertTournament(tournamentId, updatedTournamentName);
        tournament = await prismaTest.tournament.findUnique({ where: { id: tournamentId } });
        expect(tournament).not.toBeNull();
        expect(tournament?.name).toBe(updatedTournamentName);
    });

    test('should find tournaments by name', async () => {
        await prismaTest.tournament.createMany({
            data: [
                { id: '4', name: 'Tournament A' },
                { id: '5', name: 'Tournament B' },
                { id: '6', name: 'Another Tournament' },
            ],
        });

        const found = await findTournamentsByName(['Tournament A', 'Tournament B']);
        expect(found.length).toBe(2);
        expect(found.map(t => t.name)).toContain('Tournament A');
        expect(found.map(t => t.name)).toContain('Tournament B');
    });

    test('should find tournaments by year', async () => {
        await prismaTest.tournament.createMany({
            data: [
                { id: '7', name: 'Tournament 2023 A' },
                { id: '8', name: 'Tournament 2023 B' },
                { id: '9', name: 'Tournament 2024' },
            ],
        });

        const found = await findTournamentsByYear('2023');
        expect(found.length).toBe(2);
        expect(found.map(t => t.name)).toContain('Tournament 2023 A');
        expect(found.map(t => t.name)).toContain('Tournament 2023 B');
    });
});
