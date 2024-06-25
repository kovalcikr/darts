import {describe, expect, test} from '@jest/globals';
import getTournamentInfo, { setScore } from '../lib/cuescore';

describe('cuescore', () =>  {
    test('get tournament info', async () => {
        const tournament = await getTournamentInfo('43951255');
        expect(tournament.tournamentId).toBe(43951255);
        expect(tournament.name).toBe("Relax Darts CUP RADO TEST");
        expect(tournament.status).toBe("Active"); // Open
    })

    test('test update match score', async () => {
        await setScore("43951255", "44503294", 2, 2)
    })
})