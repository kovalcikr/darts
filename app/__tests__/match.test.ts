import {describe, expect, test} from '@jest/globals';
import { getCuescoreMatch, getMatch } from '../lib/match';
import exp from 'constants';

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