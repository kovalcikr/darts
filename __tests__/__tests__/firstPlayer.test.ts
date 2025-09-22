import {describe, expect, test} from '@jest/globals';
import { findScore, nextPlayer } from '../../app/lib/match';

describe('nextPlayer', () => {
    test('should return player A when leg is 1, scores are even, and A started', async () => {
        expect(await nextPlayer(1, 0, 0, "A", "B", "A")).toBe("A");
    });
    test('should return player B when leg is 1, scores are odd, and A started', async () => {
        expect(await nextPlayer(1, 1, 0, "A", "B", "A")).toBe("B");
    });
    test('should return player A when leg is 1, scores are even, and B started', async () => {
        expect(await nextPlayer(1, 0, 1, "A", "B", "B")).toBe("A");
    });
    test('should return player B when leg is 1, scores are odd, and B started', async () => {
        expect(await nextPlayer(1, 1, 1, "A", "B", "B")).toBe("B");
    });

    test('should return player B when leg is 2, scores are even, and A started', async () => {
        expect(await nextPlayer(2, 0, 0, "A", "B", "A")).toBe("B");
    });
});

describe('findScore', () => {
    const data = [
        { _sum: { score: 140 }, _count: { score: 2 }, playerId: 'A' },
        { _sum: { score: 10 }, _count: { score: 1 }, playerId: 'B' }
    ];

    test('should return the correct score for a player', async () => {
        const scoreA = await findScore(data, "A");
        expect(scoreA._sum.score).toBe(140);
        expect(scoreA._count.score).toBe(2);

        const scoreB = await findScore(data, "B");
        expect(scoreB._sum.score).toBe(10);
        expect(scoreB._count.score).toBe(1);
    });

    test('should return undefined if the player is not found', async () => {
        expect(await findScore(data, "C")).toBeUndefined();
    });
});