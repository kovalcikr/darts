import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { getCueScoreProviderName } from '../lib/integrations/cuescore';
import { FakeCueScoreGateway } from '../lib/integrations/cuescore/fake';

describe('cuescore provider selection', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.CUESCORE_PROVIDER;
        delete process.env.CUESCORE_USERNAME;
        delete process.env.CUESCORE_PASSWORD;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('uses fake provider in development without credentials', () => {
        const provider = getCueScoreProviderName({
            NODE_ENV: 'development',
        } as NodeJS.ProcessEnv);

        expect(provider).toBe('fake');
    });

    test('uses real provider in test by default', () => {
        const provider = getCueScoreProviderName({
            NODE_ENV: 'test',
        } as NodeJS.ProcessEnv);

        expect(provider).toBe('real');
    });

    test('respects explicit provider override', () => {
        const provider = getCueScoreProviderName({
            NODE_ENV: 'development',
            CUESCORE_PROVIDER: 'real',
        } as NodeJS.ProcessEnv);

        expect(provider).toBe('real');
    });
});

describe('fake cuescore gateway', () => {
    test('creates a local tournament on first access', async () => {
        const gateway = new FakeCueScoreGateway();

        const tournament = await gateway.getTournament('local-demo');

        expect(tournament.tournamentId).toBe('local-demo');
        expect(tournament.matches).toHaveLength(6);
        expect(tournament.matches[0].table?.name).toBe('11');
        expect(tournament.matches[0].matchstatus).toBe('playing');
    });

    test('persists local score updates for subsequent reads', async () => {
        const gateway = new FakeCueScoreGateway();
        const tournament = await gateway.getTournament('local-scores');
        const match = tournament.matches[0];

        await gateway.updateMatchScore({
            tournamentId: 'local-scores',
            matchId: String(match.matchId),
            scoreA: 2,
            scoreB: 1,
        });

        const updatedTournament = await gateway.getTournament('local-scores');
        const updatedMatch = updatedTournament.matches[0];

        expect(updatedMatch.scoreA).toBe(2);
        expect(updatedMatch.scoreB).toBe(1);
        expect(updatedMatch.matchstatus).toBe('playing');
    });
});
