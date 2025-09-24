import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import getTournamentInfo, { setScore, finishMatch, getRankings, getResults } from '../lib/cuescore';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

global.fetch = jest.fn() as any;

describe('cuescore', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
        mockedAxios.get.mockClear();
        (fetch as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                headers: { getSetCookie: () => ['test_cookie'] },
                json: () => Promise.resolve({}),
            })
        );
    });

    test('getTournamentInfo', async () => {
        const tournamentId = '123';
        const expectedData = { id: tournamentId, name: 'Test Tournament' };
        mockedAxios.get.mockResolvedValue({ data: expectedData });

        const result = await getTournamentInfo(tournamentId);

        expect(result).toEqual(expectedData);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://api.cuescore.com/tournament/?id=123', {
            headers: {
                Cookie: ['test_cookie'],
                cache: 'no-store'
            }
        });
    });

    test('setScore success', async () => {
        mockedAxios.get.mockResolvedValue({ data: 'OK' });
        await setScore('1', '2', 3, 4);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://cuescore.com/ajax/tournament/match.php?tournamentId=1&matchId=2&scoreA=3&scoreB=4&matchstatus=1', {
            headers: {
                Cookie: ['test_cookie']
            }
        });
    });

    test('setScore error', async () => {
        mockedAxios.get.mockResolvedValue({ data: 'Error' });
        await expect(setScore('1', '2', 3, 4)).rejects.toThrow('Cannot update score');
    });

    test('finishMatch success', async () => {
        mockedAxios.get.mockResolvedValue({ data: 'OK' });
        await finishMatch('1', '2', 3, 4, '5');
        expect(mockedAxios.get).toHaveBeenCalledWith('https://cuescore.com/ajax/tournament/match.php?tournamentId=1&matchId=2&scoreA=3&scoreB=4&matchstatus=2', {
            headers: {
                Cookie: ['test_cookie']
            }
        });
    });

    test('finishMatch error', async () => {
        mockedAxios.get.mockResolvedValue({ data: 'Error' });
        await expect(finishMatch('1', '2', 3, 4, '5')).rejects.toThrow('Cannot finish match');
    });

    test('getRankings', async () => {
        const rankingId = '123';
        const expectedData = { id: rankingId, name: 'Test Ranking' };
        mockedAxios.get.mockResolvedValue({ data: expectedData });

        const result = await getRankings(rankingId);

        expect(result).toEqual(expectedData);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://api.cuescore.com/ranking/?id=123', {
            headers: {
                Cookie: ['test_cookie']
            }
        });
    });

    test('getResults', async () => {
        const tournamentId = '123';
        const expectedData = { id: tournamentId, name: 'Test Results' };
        mockedAxios.get.mockResolvedValue({ data: expectedData });

        const result = await getResults(tournamentId);

        expect(result).toEqual(expectedData);
        expect(mockedAxios.get).toHaveBeenCalledWith('https://api.cuescore.com/tournament/?id=123}&results=Result+list', {
            headers: {
                Cookie: ['test_cookie']
            }
        });
    });
});