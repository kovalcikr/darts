import { GET } from '@/app/api/dashboard/tournament/[id]/route';
import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { getCuescoreMatchCached, getMatch } from '@/app/lib/match';
import { getPlayerThrowInfo } from '@/app/lib/playerThrow';

jest.mock('@/app/lib/match');
jest.mock('@/app/lib/playerThrow');

const getCuescoreMatchCachedMock = getCuescoreMatchCached as jest.Mock<() => Promise<any>>;
const getMatchMock = getMatch as jest.Mock<() => Promise<any>>;
const getPlayerThrowInfoMock = getPlayerThrowInfo as jest.Mock<() => Promise<any>>;

describe('Caching Integration Tests', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('should return cached data', async () => {
        const match1 = {
            matchId: 123,
            playerA: { playerId: '456' },
            playerB: { playerId: '789' },
            scoreA: 0,
            scoreB: 0,
        };

        getCuescoreMatchCachedMock.mockResolvedValue(match1);
        getPlayerThrowInfoMock.mockResolvedValue({ score: [], lastThrows: [] });
        getMatchMock.mockResolvedValue({ firstPlayer: '123' });

        const request = {
            nextUrl: {
                searchParams: new URLSearchParams(),
            },
        };

        const response1 = await GET(request as any, { params: { id: '1' } });
        const data1 = await response1.json();
        expect(data1.match1.scoreA).toBe(0);

        const response2 = await GET(request as any, { params: { id: '1' } });
        const data2 = await response2.json();
        expect(data2.match1.scoreA).toBe(0);
    });
});