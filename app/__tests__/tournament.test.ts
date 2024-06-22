import {describe, expect, test} from '@jest/globals';
import { openTournament } from '../lib/tournament';

describe('tournament', () => {
    test('open tournament', async () => {
        const tournamentId = '43951255'
        const tournamentData = await openTournament(tournamentId);
    })
})