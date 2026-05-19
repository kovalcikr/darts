import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import * as match from '../lib/match';
import getTournamentInfo from '../lib/cuescore';
import type { Match } from '@/prisma/client';
import * as data from '../lib/data';

jest.mock('../lib/cuescore', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../lib/data');
jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

const mockMatch: Match & { tournament: { id: string; name: string } } = {
    id: 'm1',
    round: 'r1',
    playerAId: 'pA',
    playerAName: 'Player A',
    playerAImage: 'imgA',
    playerBId: 'pB',
    playerBName: 'Player B',
    playerBImage: 'imgB',
    runTo: 5,
    playerALegs: 1,
    playerBlegs: 0,
    isComplete: false,
    firstPlayer: 'pA',
    tournamentId: 't1',
    tournament: { id: 't1', name: 'Test Tournament' }
};


describe('match', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockTournament = {
        matches: [
            { matchstatus: 'playing', table: { name: '1' }, matchId: '123' },
            { matchstatus: 'finished', table: { name: '2' }, matchId: '456' },
        ],
    };

    test('getCuescoreMatchCached', async () => {
        jest.mocked(getTournamentInfo).mockResolvedValue(mockTournament as any);
        const result = await match.getCuescoreMatchCached('t1', '1');
        expect(getTournamentInfo).toHaveBeenCalledWith('t1');
        expect(result.matchId).toBe('123');
    });

    test('getCuescoreMatch', async () => {
        jest.mocked(getTournamentInfo).mockResolvedValue(mockTournament as any);
        const result = await match.getCuescoreMatch('t1', '1');
        expect(getTournamentInfo).toHaveBeenCalledWith('t1');
        expect(result.matchId).toBe('123');
    });

    test('getCuescoreMatch not found', async () => {
        jest.mocked(getTournamentInfo).mockResolvedValue(mockTournament as any);
        await expect(match.getCuescoreMatch('t1', '3')).rejects.toThrow('No match in progress on table 3');
    });

    test('getFullMatch', async () => {
        const matchId = 'm1';
        jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
        jest.mocked(data.findThrowsByMatch).mockResolvedValue([]);
        jest.mocked(data.findScoreboardThrowHistory).mockResolvedValue([]);
        jest.mocked(data.findHighestScoreInMatch).mockResolvedValue(180);
        jest.mocked(data.findBestCheckoutInMatch).mockResolvedValue(100);
        jest.mocked(data.findBestLegInMatch).mockResolvedValue(15);
        jest.mocked(data.aggregateMatchThrows).mockResolvedValue({ _sum: { score: 1000, darts: 50 } });

        const fullMatch = await match.getFullMatch(matchId);

        expect(fullMatch.match).toEqual(mockMatch);
        expect(fullMatch.playerA.score).toBe(501);
        expect(fullMatch.startingPlayerId).toBe('pB');
    });

    test('getFullMatch returns null when the match does not exist', async () => {
        jest.mocked(data.findMatch).mockResolvedValue(null);

        const fullMatch = await match.getFullMatch('missing-match');

        expect(fullMatch).toBeNull();
        expect(data.findThrowsByMatch).not.toHaveBeenCalled();
        expect(data.findScoreboardThrowHistory).not.toHaveBeenCalled();
        expect(data.findHighestScoreInMatch).not.toHaveBeenCalled();
        expect(data.findBestCheckoutInMatch).not.toHaveBeenCalled();
        expect(data.findBestLegInMatch).not.toHaveBeenCalled();
    });

    test('createMatch', async () => {
        const matchData = {
            matchId: 'm1',
            tournamentId: 't1',
            playerA: { playerId: 'pA', name: 'Player A', image: 'imgA' },
            playerB: { playerId: 'pB', name: 'Player B', image: 'imgB' },
            roundName: 'r1',
            raceTo: 5,
        };
        jest.mocked(data.upsertMatch).mockResolvedValue(null);
        await match.createMatch(matchData, '1');
        expect(data.upsertMatch).toHaveBeenCalledWith(matchData, '1');
    });

    test('setStartingPlayer', async () => {
        jest.mocked(data.updateMatchFirstPlayer).mockResolvedValue(null);
        await match.setStartingPlayer('m1', 'pA');
        expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', 'pA');
    });

    test('startMatch', async () => {
        const formData = new FormData();
        formData.append('matchId', 'm1');
        formData.append('firstPlayer', 'pA');
        formData.append('table', '1');
        jest.mocked(data.updateMatchFirstPlayer).mockResolvedValue(null);
        const { redirect } = await import('next/navigation');
        await match.startMatch(formData);
        expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', 'pA');
        expect(redirect).toHaveBeenCalledWith('/tables/1');
    });

    test('getThrows', async () => {
        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue([]);
        await match.getThrows('m1', 1, 'pA', 'pB');
        expect(data.findThrowsByMatchAndLeg).toHaveBeenCalledWith('m1', 1, 'pA', 'pB');
    });

    test('getScores uses scoring module', async () => {
      jest.mocked(data.findActiveThrowsByMatchAndLeg).mockResolvedValue([
        { playerId: 'pA', score: 60, darts: 2 },
        { playerId: 'pA', score: 40, darts: 3 },
        { playerId: 'pB', score: 50, darts: 2 },
      ] as any);
      const scores = await match.getScores('m1', 1, 'pA', 'pB', 'pA');
      expect(scores.playerA).toBe(401);
      expect(scores.playerB).toBe(451);
      expect(scores.playerADarts).toBe(5);
      expect(scores.playerBDarts).toBe(2);
      expect(scores.nextPlayer).toBe('pB');
    });

    test('getScores keeps turn order from individual throws, not grouped players', async () => {
      jest.mocked(data.findActiveThrowsByMatchAndLeg).mockResolvedValue([
        { playerId: 'pA', score: 180, darts: 3 },
        { playerId: 'pB', score: 0, darts: 3 },
        { playerId: 'pA', score: 180, darts: 3 },
      ] as any);

      const scores = await match.getScores('m1', 1, 'pA', 'pB', 'pA');

      expect(scores.playerA).toBe(141);
      expect(scores.playerB).toBe(501);
      expect(scores.nextPlayer).toBe('pB');
    });

    test('nextPlayer via scoring module', async () => {
        const { calculateLegState } = await import('../lib/score-entry');
        
        // Test the next player logic through the scoring module
        let state = calculateLegState({ leg: 1, throws: [], playerAId: 'pA', playerBId: 'pB', firstPlayer: 'pA' });
        expect(state.nextPlayer).toBe('pA');
        
        state = calculateLegState({ leg: 1, throws: [{ playerId: 'pA', score: 60, darts: 3 }], playerAId: 'pA', playerBId: 'pB', firstPlayer: 'pA' });
        expect(state.nextPlayer).toBe('pB');
    });

    test('getMatch', async () => {
        jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
        await match.getMatch('m1');
        expect(data.findMatch).toHaveBeenCalledWith('m1');
    })
});
