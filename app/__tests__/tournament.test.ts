import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { openTournament, createTournament, getTournaments, getCachedTournaments, openTournamentForm } from '../lib/tournament';
import getTournamentInfo from '../lib/cuescore';
import * as data from '../lib/data';

jest.mock('../lib/cuescore', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../lib/data');
jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
    unstable_cache: jest.fn((fn) => fn),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

describe('tournament', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('open tournament', async () => {
        const tournamentId = '43951255';
        const tournamentData = { tournamentId, name: 'Test Tournament' };
        jest.mocked(getTournamentInfo).mockResolvedValue(tournamentData as any);
        jest.mocked(data.upsertTournament).mockResolvedValue(null);

        await openTournament(tournamentId);

        expect(getTournamentInfo).toHaveBeenCalledWith(tournamentId);
        expect(data.upsertTournament).toHaveBeenCalledWith(tournamentId, {
            name: 'Test Tournament',
            season: null,
            eventDate: null,
        });
    });

    test('create tournament', async () => {
        const tournament = { tournamentId: '123', name: 'New Tournament' };
        jest.mocked(data.upsertTournament).mockResolvedValue(null);
        await createTournament(tournament);
        expect(data.upsertTournament).toHaveBeenCalledWith('123', {
            name: 'New Tournament',
            season: null,
            eventDate: null,
        });
    });

    test('create tournament falls back to requested id and local name', async () => {
        jest.mocked(data.upsertTournament).mockResolvedValue(null);
        await createTournament({} as any, 'local-smoke');
        expect(data.upsertTournament).toHaveBeenCalledWith('local-smoke', {
            name: 'Local Tournament local-smoke',
            season: null,
            eventDate: null,
        });
    });

    test('open tournament falls back to requested id when gateway payload omits it', async () => {
        jest.mocked(getTournamentInfo).mockResolvedValue({} as any);
        jest.mocked(data.upsertTournament).mockResolvedValue(null);

        await openTournament('local-smoke');

        expect(data.upsertTournament).toHaveBeenCalledWith('local-smoke', {
            name: 'Local Tournament local-smoke',
            season: null,
            eventDate: null,
        });
    });

    test('create tournament derives season and event date from metadata', async () => {
        jest.mocked(data.upsertTournament).mockResolvedValue(null);
        await createTournament({
            tournamentId: '321',
            name: 'Spring Open',
            season: '2026',
            eventDate: '2026-04-12T10:30:00.000Z',
        });
        expect(data.upsertTournament).toHaveBeenCalledWith('321', {
            name: 'Spring Open',
            season: 2026,
            eventDate: new Date('2026-04-12T10:30:00.000Z'),
        });
    });

    test('get tournaments 2024', async () => {
        jest.mocked(data.findTournamentsBySeason).mockResolvedValue([{ id: '123', name: 'Relax Darts CUP 13 2024' }] as any);
        const tournaments = await getTournaments("2024");
        expect(data.findTournamentsBySeason).toHaveBeenCalledWith(2024);
        expect(tournaments).toEqual(['123']);
    });

    test('get tournaments 2025', async () => {
        jest.mocked(data.findTournamentsBySeason).mockResolvedValue([{ id: '456', name: 'Relax Darts CUP 1 2025' }] as any);
        const tournaments = await getTournaments("2025");
        expect(data.findTournamentsBySeason).toHaveBeenCalledWith(2025);
        expect(tournaments).toEqual(['456']);
    });

    test('get tournaments 2026', async () => {
        jest.mocked(data.findTournamentsBySeason).mockResolvedValue([{ id: '789', name: 'Relax Darts CUP 1 2026' }] as any);
        const tournaments = await getTournaments("2026");
        expect(data.findTournamentsBySeason).toHaveBeenCalledWith(2026);
        expect(tournaments).toEqual(['789']);
    });

    test('get cached tournaments', async () => {
        jest.mocked(data.findTournamentsBySeason).mockResolvedValue([{ id: '123', name: 'Test 2025' }] as any);
        const tournaments = await getCachedTournaments("2025");
        expect(data.findTournamentsBySeason).toHaveBeenCalledWith(2025);
        expect(tournaments).toEqual([{ id: '123', name: 'Test 2025' }]);
    });

    test('open tournament form success', async () => {
        const formData = new FormData();
        formData.append('tournamentId', '123');
        const tournamentData = { tournamentId: '123', name: 'Test Tournament' };
        jest.mocked(getTournamentInfo).mockResolvedValue(tournamentData as any);
        jest.mocked(data.upsertTournament).mockResolvedValue(null);

        await openTournamentForm({}, formData);
        expect(getTournamentInfo).toHaveBeenCalledWith('123');
    });

    test('open tournament form error', async () => {
        const formData = new FormData();
        formData.append('tournamentId', '123');
        jest.mocked(getTournamentInfo).mockRejectedValue(new Error('Test Error'));
        const result = await openTournamentForm({}, formData);
        expect(result.message).toBe('Cannot open tournament: Test Error');
    });
});
