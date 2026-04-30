import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { getCueScoreProviderName } from '../lib/integrations/cuescore';
import { FakeCueScoreGateway, getFakeCueScoreSnapshot, resetFakeCueScoreStore } from '../lib/integrations/cuescore/fake';

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
    beforeEach(() => {
        resetFakeCueScoreStore();
    });

    test('creates a local tournament on first access', async () => {
        const gateway = new FakeCueScoreGateway();

        const tournament = await gateway.getTournament('local-demo');

        expect(tournament.tournamentId).toBe('local-demo');
        expect(tournament.matches).toHaveLength(6);
        expect(tournament.matches[0].table?.name).toBe('11');
        expect(tournament.matches[0].matchstatus).toBe('playing');
        expect(tournament.matches[4].table?.name).toBe('15');
        expect(tournament.matches[4].playerA.name).toBe('AlexandertheGreatestDartsPlayerWithAnExtremelyLongUnbrokenName');
        expect(tournament.matches[4].playerB.name).toBe('Žofia Šampiónová Extra Long Tactical Checkout Specialist');
        expect(tournament.matches[5].table?.name).toBe('16');
        expect(tournament.matches[5].playerA.name).toBe('Peter Kovarik');
        expect(tournament.matches[5].playerB.name).toBe('Peter Kovakir');
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

    test('returns cloned tournament data so callers cannot mutate the store', async () => {
        const gateway = new FakeCueScoreGateway();

        const tournament = await gateway.getTournament('local-clone');
        tournament.name = 'Changed locally';
        tournament.matches[0].scoreA = 9;

        const freshTournament = await gateway.getTournament('local-clone');

        expect(freshTournament.name).toBe('Local Tournament local-clone');
        expect(freshTournament.matches[0].scoreA).toBe(0);
    });

    test('marks matches as finished and reopens them when scores change again', async () => {
        const gateway = new FakeCueScoreGateway();
        const tournament = await gateway.getTournament('local-finish');
        const matchId = String(tournament.matches[0].matchId);

        await gateway.finishMatch({
            tournamentId: 'local-finish',
            matchId,
            scoreA: 3,
            scoreB: 1,
        });

        let updatedTournament = await gateway.getTournament('local-finish');
        expect(updatedTournament.matches[0].matchstatus).toBe('finished');
        expect(updatedTournament.matches[0].scoreA).toBe(3);
        expect(updatedTournament.matches[0].scoreB).toBe(1);

        await gateway.updateMatchScore({
            tournamentId: 'local-finish',
            matchId,
            scoreA: 2,
            scoreB: 2,
        });

        updatedTournament = await gateway.getTournament('local-finish');
        expect(updatedTournament.matches[0].matchstatus).toBe('playing');
        expect(updatedTournament.matches[0].scoreA).toBe(2);
        expect(updatedTournament.matches[0].scoreB).toBe(2);
    });

    test('builds ranking and result payloads from local tournament data', async () => {
        const gateway = new FakeCueScoreGateway();

        await gateway.getTournament('local-ranking');

        const ranking = await gateway.getRanking('local-ranking');
        const results = await gateway.getResults('local-ranking');

        expect(ranking.participants).toHaveLength(12);
        expect(ranking.participants[0].rank).toBe(1);
        expect(ranking.participants.map((participant) => participant.name)).toContain('Fero Hruska');
        expect(results).toEqual({ tournamentId: 'local-ranking' });
    });

    test('returns cached ranking and results data as clones when present', async () => {
        const store = (globalThis as any).fakeCueScoreStore;
        store.rankings.set('cached-ranking', {
            participants: [{ participantId: 'p1', rank: 1, name: 'Cached Player' }],
        });
        store.results.set('cached-results', {
            tournamentId: 'cached-results',
            1: [{ name: 'Cached Winner' }],
        });

        const gateway = new FakeCueScoreGateway();

        const ranking = await gateway.getRanking('cached-ranking');
        const results = await gateway.getResults('cached-results');
        ranking.participants[0].name = 'Changed';
        results[1][0].name = 'Changed';

        const freshRanking = await gateway.getRanking('cached-ranking');
        const freshResults = await gateway.getResults('cached-results');

        expect(freshRanking.participants[0].name).toBe('Cached Player');
        expect(freshResults[1][0].name).toBe('Cached Winner');
    });

    test('throws when updating a local match that does not exist', async () => {
        const gateway = new FakeCueScoreGateway();

        await expect(gateway.finishMatch({
            tournamentId: 'local-missing',
            matchId: 'missing-match',
            scoreA: 1,
            scoreB: 0,
        })).rejects.toThrow('Cannot find local match missing-match');
    });

    test('exposes test snapshots and can reset a single tournament store', async () => {
        const gateway = new FakeCueScoreGateway();
        const tournament = await gateway.getTournament('local-assertions');
        const matchId = String(tournament.matches[0].matchId);

        await gateway.updateMatchScore({
            tournamentId: 'local-assertions',
            matchId,
            scoreA: 1,
            scoreB: 0,
        });

        expect(getFakeCueScoreSnapshot('local-assertions')).toEqual({
            tournament: expect.objectContaining({
                tournamentId: 'local-assertions',
            }),
            events: [
                {
                    type: 'updateMatchScore',
                    tournamentId: 'local-assertions',
                    matchId,
                    scoreA: 1,
                    scoreB: 0,
                },
            ],
        });

        resetFakeCueScoreStore('local-assertions');

        expect(getFakeCueScoreSnapshot('local-assertions')).toEqual({
            tournament: null,
            events: [],
        });
    });
});
