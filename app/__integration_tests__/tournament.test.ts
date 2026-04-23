import type { PrismaClient } from '@/prisma/client';
import prisma from '@/app/lib/db';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { upsertTournament, findTournamentsByName, findTournamentsBySeason } from '@/app/lib/data';

const prismaTest = prisma as unknown as PrismaClient;

describe('Tournament Integration Tests', () => {
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

    test('should upsert a tournament', async () => {
        const tournamentId = '1';
        const tournamentName = 'Test Tournament';

        // Create
        await upsertTournament(tournamentId, { name: tournamentName, season: 2026 });
        let tournament = await prismaTest.tournament.findUnique({ where: { id: tournamentId } });
        expect(tournament).not.toBeNull();
        expect(tournament?.name).toBe(tournamentName);
        expect(tournament?.season).toBe(2026);
        expect(tournament?.includeInGlobalStats).toBe(true);

        // Update
        const updatedTournamentName = 'Updated Test Tournament';
        await upsertTournament(tournamentId, {
            name: updatedTournamentName,
            season: 2025,
            eventDate: new Date('2025-05-01T00:00:00.000Z'),
        });
        tournament = await prismaTest.tournament.findUnique({ where: { id: tournamentId } });
        expect(tournament).not.toBeNull();
        expect(tournament?.name).toBe(updatedTournamentName);
        expect(tournament?.season).toBe(2025);
        expect(tournament?.eventDate?.toISOString()).toBe('2025-05-01T00:00:00.000Z');
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

    test('should find tournaments by season', async () => {
        await prismaTest.tournament.createMany({
            data: [
                { id: '7', name: 'Tournament 2023 A', season: 2023, includeInGlobalStats: true },
                { id: '8', name: 'Tournament 2023 B', season: 2023, includeInGlobalStats: true },
                { id: '9', name: 'Tournament 2024', season: 2024, includeInGlobalStats: true },
            ],
        });

        const found = await findTournamentsBySeason(2023);
        expect(found.length).toBe(2);
        expect(found.map(t => t.name)).toContain('Tournament 2023 A');
        expect(found.map(t => t.name)).toContain('Tournament 2023 B');
    });

    test('should exclude opted-out tournaments from global season lookups by default', async () => {
        await prismaTest.tournament.createMany({
            data: [
                { id: '13', name: 'Included 2026', season: 2026, includeInGlobalStats: true },
                { id: '14', name: 'Excluded 2026', season: 2026, includeInGlobalStats: false },
            ],
        });

        const found = await findTournamentsBySeason(2026);
        expect(found.map(t => t.name)).toContain('Included 2026');
        expect(found.map(t => t.name)).not.toContain('Excluded 2026');
    });

    test('should include opted-out tournaments when explicitly requested', async () => {
        await prismaTest.tournament.createMany({
            data: [
                { id: '15', name: 'Included 2026 B', season: 2026, includeInGlobalStats: true },
                { id: '16', name: 'Excluded 2026 B', season: 2026, includeInGlobalStats: false },
            ],
        });

        const found = await findTournamentsBySeason(2026, { includeExcluded: true });
        expect(found.map(t => t.name)).toContain('Included 2026 B');
        expect(found.map(t => t.name)).toContain('Excluded 2026 B');
    });

    test('should fall back to the legacy 2024 names when season is missing', async () => {
        await prismaTest.tournament.createMany({
            data: [
                { id: '10', name: 'Relax Darts CUP 13 2024' },
                { id: '11', name: 'Relax Darts CUP 24 2024' },
                { id: '12', name: 'Friendly Tournament 2024' },
            ],
        });

        const found = await findTournamentsBySeason(2024);
        expect(found.map(t => t.name)).toContain('Relax Darts CUP 13 2024');
        expect(found.map(t => t.name)).toContain('Relax Darts CUP 24 2024');
        expect(found.map(t => t.name)).not.toContain('Friendly Tournament 2024');
    });
});
