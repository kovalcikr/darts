import {describe, expect, test, jest} from '@jest/globals';
import { openTournament } from '../../app/lib/tournament';
import getTournamentInfo from '../../app/lib/cuescore';
import { createTournament } from '../../app/lib/tournamentActions';

jest.mock('../../app/lib/cuescore');
jest.mock('../../app/lib/tournamentActions');
const mockedGetTournamentInfo = getTournamentInfo as jest.MockedFunction<typeof getTournamentInfo>;
const mockedCreateTournament = createTournament as jest.MockedFunction<typeof createTournament>;

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
    unstable_cache: jest.fn((fn) => fn),
}));

describe('tournament', () => {
    test('open tournament', async () => {
        const tournamentId = '43951255';
        const mockData = {
            "tournamentId": 43951255,
            "name": "Relax Darts CUP RADO TEST",
            "status": "Active",
            "matches": []
        };
        mockedGetTournamentInfo.mockResolvedValue(mockData);
        mockedCreateTournament.mockResolvedValue({
            id: '43951255',
            name: 'Relax Darts CUP RADO TEST'
        });

        await openTournament(tournamentId);
        expect(mockedCreateTournament).toHaveBeenCalledWith(mockData);
    });
});