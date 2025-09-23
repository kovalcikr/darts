import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { getPlayers } from '../lib/players';
import * as data from '../lib/data';

jest.mock('../lib/data');

describe('players', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getPlayers', async () => {
        const tournaments = ['t1', 't2'];
        const playersA = [
            { playerAId: 'pA1', playerAName: 'Player A1' },
            { playerAId: 'pA2', playerAName: 'Player A2' },
        ];
        const playersB = [
            { playerBId: 'pB1', playerBName: 'Player B1' },
            { playerBId: 'pB2', playerBName: 'Player B2' },
        ];
        jest.mocked(data.findPlayersByTournament).mockResolvedValue({ playersA, playersB } as any);

        const players = await getPlayers(tournaments);

        expect(players).toEqual({
            pA1: 'Player A1',
            pA2: 'Player A2',
            pB1: 'Player B1',
            pB2: 'Player B2',
        });
        expect(data.findPlayersByTournament).toHaveBeenCalledWith(tournaments);
    });
});
