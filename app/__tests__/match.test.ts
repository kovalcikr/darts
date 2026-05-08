import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import * as match from '../lib/match';
import getTournamentInfo from '../lib/cuescore';
import { findLastThrow, findMatchAvg } from '../lib/playerThrow';
import type { Match } from '@/prisma/client';
import * as data from '../lib/data';
import * as matchLiveState from '../lib/match-live-state';
import prisma from '../lib/db';

jest.mock('../lib/cuescore', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../lib/playerThrow', () => ({
    findLastThrow: jest.fn(),
    findMatchAvg: jest.fn(),
}));

jest.mock('../lib/data', () => ({
    findMatch: jest.fn(),
    findThrowsByMatch: jest.fn(),
    findThrowsByMatchAndLeg: jest.fn(),
    findActiveThrowsByMatchAndLeg: jest.fn(),
    findLastThrow: jest.fn(),
    findMatchAvg: jest.fn(),
    findHighestScoreInMatch: jest.fn(),
    findBestCheckoutInMatch: jest.fn(),
    findBestLegInMatch: jest.fn(),
    findScoreboardThrowHistory: jest.fn(),
    upsertMatch: jest.fn(),
    updateMatchFirstPlayer: jest.fn(),
    findMatchLiveStates: jest.fn(),
    activeThrowWhere: jest.fn(),
}));
jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));
jest.mock('../lib/match-live-state', () => ({
    refreshMatchLiveState: jest.fn(),
    findMatchLiveStates: jest.fn(),
}));
jest.mock('../lib/db', () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn(),
    },
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
        ;(prisma.$transaction as unknown as jest.Mock).mockImplementation(async (fn) => {
            await fn({} as never);
        });
    });

    const mockTournament = {
        matches: [
            { matchstatus: 'playing', table: { name: '1' }, matchId: '123' },
            { matchstatus: 'finished', table: { name: '2' }, matchId: '456' },
        ],
    } as any;

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
        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue([]);
        jest.mocked(data.findActiveThrowsByMatchAndLeg).mockResolvedValue([]);
        jest.mocked(findLastThrow).mockResolvedValue({ score: 60 } as any);
        jest.mocked(findMatchAvg).mockResolvedValue(80);
        // Fallback path - no live state, so startingPlayerId comes from match.firstPlayer
        jest.mocked(matchLiveState.findMatchLiveStates).mockResolvedValue([]);

        const fullMatch = await match.getFullMatch(matchId);

        expect(fullMatch.match).toEqual(mockMatch);
        expect(fullMatch.playerA.score).toBe(501);
        expect(fullMatch.startingPlayerId).toBe('pA'); // match.firstPlayer
    });

    test('getFullMatch returns null when the match does not exist', async () => {
        jest.mocked(data.findMatch).mockResolvedValue(null);

        const fullMatch = await match.getFullMatch('missing-match');

        expect(fullMatch).toBeNull();
        expect(data.findThrowsByMatchAndLeg).not.toHaveBeenCalled();
        expect(findLastThrow).not.toHaveBeenCalled();
        expect(findMatchAvg).not.toHaveBeenCalled();
        expect(data.findThrowsByMatch).not.toHaveBeenCalled();
        expect(data.findHighestScoreInMatch).not.toHaveBeenCalled();
        expect(data.findBestCheckoutInMatch).not.toHaveBeenCalled();
        expect(data.findBestLegInMatch).not.toHaveBeenCalled();
    });

    test('getFullMatch reads from matchLiveState when projection exists', async () => {
        const mockLiveState = {
            matchId: 'm1',
            tournamentId: 't1',
            table: '1',
            leg: 1,
            playerAScoreLeft: 401,
            playerBScoreLeft: 451,
            playerATotalScore: 100,
            playerBTotalScore: 50,
            playerATotalDarts: 3,
            playerBTotalDarts: 3,
            activePlayerId: 'pB',
            startingPlayerId: 'pA',
            lastThrows: [
                { playerId: 'pA', score: 60, darts: 2, checkout: false, leg: 1 },
                { playerId: 'pB', score: 50, darts: 2, checkout: false, leg: 1 },
            ],
        };

        jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
        jest.mocked(matchLiveState.findMatchLiveStates).mockResolvedValue([mockLiveState]);
        jest.mocked(data.findHighestScoreInMatch).mockResolvedValue(180);
        jest.mocked(data.findBestCheckoutInMatch).mockResolvedValue(100);
        jest.mocked(data.findBestLegInMatch).mockResolvedValue(9);
        jest.mocked(data.findThrowsByMatch).mockResolvedValue([]);
        jest.mocked(data.findScoreboardThrowHistory).mockResolvedValue([]);

        const fullMatch = await match.getFullMatch('m1');

        expect(fullMatch.match).toEqual(mockMatch);
        expect(fullMatch.playerA.score).toBe(401);
        expect(fullMatch.playerB.score).toBe(451);
        expect(fullMatch.playerA.matchAvg).toBe(100); // (100 / 3 * 3) = 100
        expect(fullMatch.playerB.matchAvg).toBeCloseTo(50); // (50 / 3 * 3) = 50
        expect(fullMatch.nextPlayer).toBe('pB');
        expect(fullMatch.startingPlayerId).toBe('pA');
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

    test('startMatch uses transaction to update first player and refresh live state', async () => {
        const formData = new FormData();
        formData.append('matchId', 'm1');
        formData.append('firstPlayer', 'pA');
        formData.append('table', '1');
        
        // Mock updateMatchFirstPlayer to verify it was called
        jest.mocked(data.updateMatchFirstPlayer).mockResolvedValue({} as any);
        
        // Mock refreshMatchLiveState to verify it was called
        const mockLiveState = {
            matchId: 'm1',
            tournamentId: 't1',
            table: '1',
            leg: 1,
            playerAScoreLeft: 501,
            playerBScoreLeft: 501,
            playerATotalScore: 0,
            playerBTotalScore: 0,
            playerATotalDarts: 0,
            playerBTotalDarts: 0,
            activePlayerId: 'pA',
            startingPlayerId: 'pA',
            lastThrows: [],
        };
        jest.mocked(matchLiveState.refreshMatchLiveState).mockResolvedValue(mockLiveState as any);

        await match.startMatch(formData);
        
        // Verify both functions were called (transaction verified by the fact both were called)
        expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', 'pA', expect.anything());
        expect(matchLiveState.refreshMatchLiveState).toHaveBeenCalledWith('m1', '1', expect.anything());
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
        const { calculateLegState } = await import('../lib/scoring');
        
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
