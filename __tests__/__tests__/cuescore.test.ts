import {describe, expect, test, jest} from '@jest/globals';
import getTournamentInfo, { setScore } from '../../app/lib/cuescore';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('cuescore', () =>  {
    test('get tournament info', async () => {
        const mockData = {
            "tournamentId": 43951255,
            "name": "Relax Darts CUP RADO TEST",
            "status": "Active"
        };
        mockedAxios.get.mockResolvedValue({ data: mockData });

        const tournament = await getTournamentInfo('43951255');
        expect(tournament.tournamentId).toBe(43951255);
        expect(tournament.name).toBe("Relax Darts CUP RADO TEST");
        expect(tournament.status).toBe("Active");
    });

    test('test update match score', async () => {
        mockedAxios.get.mockResolvedValue({ data: "OK" });

        await expect(setScore("43951255", "44503294", 2, 2)).resolves.not.toThrow();
    });

    test('test update match score should throw error', async () => {
        mockedAxios.get.mockResolvedValue({ data: "ERROR" });

        await expect(setScore("43951255", "44503294", 2, 2)).rejects.toThrow('Cannot update score');
    });
})