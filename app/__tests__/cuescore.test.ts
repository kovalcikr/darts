import {describe, expect, test} from '@jest/globals';
import getTournamentInfo from '../lib/cuescore';

describe('cuescore', () =>  {
    test('get tournament info', async () => {
        const tournament = await getTournamentInfo('43951255');
        expect(tournament.tournamentId).toBe(43951255);
        expect(tournament.name).toBe("Relax Darts CUP RADO TEST");
        expect(tournament.status).toBe("Active"); // Open
    })
})