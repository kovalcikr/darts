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
        expect(data.upsertTournament).toHaveBeenCalledWith(tournamentId, 'Test Tournament');
    });

    test('create tournament', async () => {
        const tournament = { tournamentId: '123', name: 'New Tournament' };
        jest.mocked(data.upsertTournament).mockResolvedValue(null);
        await createTournament(tournament);
        expect(data.upsertTournament).toHaveBeenCalledWith('123', 'New Tournament');
    });

    test('get tournaments', async () => {
        jest.mocked(data.findTournamentsByYear).mockResolvedValue([{ id: '123', name: 'Relax Darts CUP 13 2024' }] as any);
        const tournaments = await getTournaments("2024");
        expect(data.findTournamentsByYear).toHaveBeenCalledWith("2024");
        expect(tournaments).toEqual(['123']);
    });

    test('get cached tournaments', async () => {
        jest.mocked(data.findTournamentsByYear).mockResolvedValue([{ id: '123', name: 'Test 2025' }] as any);
        const getTournaments = getCachedTournaments("2025");
        const tournaments = await getTournaments();
        expect(data.findTournamentsByYear).toHaveBeenCalledWith("2025");
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