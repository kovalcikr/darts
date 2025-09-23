import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import * as match from '../lib/match';
import getTournamentInfo from '../lib/cuescore';
import { findLastThrow, findMatchAvg } from '../lib/playerThrow';
import { Match, Tournament } from '@prisma/client';
import * as data from '../lib/data';

jest.mock('../lib/cuescore', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../lib/playerThrow', () => ({
    findLastThrow: jest.fn(),
    findMatchAvg: jest.fn(),
}));

jest.mock('../lib/data');
jest.mock('next/cache', () => ({
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

const mockMatch: Match & { tournament: Tournament } = {
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
        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue([]);
        jest.mocked(findLastThrow).mockResolvedValue({ score: 60 } as any);
        jest.mocked(findMatchAvg).mockResolvedValue(80);

        const fullMatch = await match.getFullMatch(matchId, false);

        expect(fullMatch.match).toEqual(mockMatch);
        expect(fullMatch.playerA.score).toBe(501);
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
        await match.createMatch(matchData);
        expect(data.upsertMatch).toHaveBeenCalledWith(matchData);
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
        await match.startMatch(formData);
        expect(data.updateMatchFirstPlayer).toHaveBeenCalledWith('m1', 'pA');
    });

    test('resetMatch', async () => {
        const formData = new FormData();
        formData.append('matchId', 'm1');
        jest.mocked(data.resetMatchData).mockResolvedValue(null);
        await match.resetMatch(formData);
        expect(data.resetMatchData).toHaveBeenCalledWith('m1');
    });

    test('getThrows', async () => {
        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue([]);
        await match.getThrows('m1', 1, 'pA', 'pB');
        expect(data.findThrowsByMatchAndLeg).toHaveBeenCalledWith('m1', 1, 'pA', 'pB');
    });

    test('getScores', async () => {
        jest.mocked(data.findThrowsByMatchAndLeg).mockResolvedValue([
            { playerId: 'pA', _sum: { score: 100 }, _count: { score: 2 } },
            { playerId: 'pB', _sum: { score: 50 }, _count: { score: 1 } },
        ] as any);
        const scores = await match.getScores('m1', 1, 'pA', 'pB', 'pA');
        expect(scores.playerA).toBe(401);
        expect(scores.playerB).toBe(451);
        expect(scores.playerADarts).toBe(6);
        expect(scores.playerBDarts).toBe(3);
    });

    test('nextPlayer', async () => {
        let player = await match.nextPlayer(1, 0, 0, 'pA', 'pB', 'pA');
        expect(player).toBe('pA');
        player = await match.nextPlayer(1, 1, 0, 'pA', 'pB', 'pA');
        expect(player).toBe('pB');
    });

    test('getMatch', async () => {
        jest.mocked(data.findMatch).mockResolvedValue(mockMatch);
        await match.getMatch('m1');
        expect(data.findMatch).toHaveBeenCalledWith('m1');
    })
});