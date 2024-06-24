import {describe, expect, test} from '@jest/globals';
import { openTournament } from '../lib/tournament';
import { findScore, nextPlayer } from '../lib/match';

describe('first player', () => {
    test('find frst player', () => {
        expect(nextPlayer(1, 0, 0, "A", "B", "A")).toBe("A");
        expect(nextPlayer(1, 1, 0, "A", "B", "A")).toBe("B");
        expect(nextPlayer(1, 1, 1, "A", "B", "A")).toBe("A");
        expect(nextPlayer(1, 0, 0, "A", "B", "B")).toBe("B");
        expect(nextPlayer(1, 0, 1, "A", "B", "B")).toBe("A");
        expect(nextPlayer(1, 1, 1, "A", "B", "B")).toBe("B");
        expect(nextPlayer(1, 3, 1, "A", "B", "B")).toBe("B");
        expect(nextPlayer(1, 5, 1, "A", "B", "B")).toBe("B");
        
        expect(nextPlayer(2, 0, 0, "A", "B", "A")).toBe("B");
        expect(nextPlayer(2, 0, 1, "A", "B", "A")).toBe("A");
        expect(nextPlayer(2, 1, 1, "A", "B", "A")).toBe("B");

        expect(nextPlayer(3, 1, 1, "A", "B", "A")).toBe("A");
    })
})

describe('score test', () => {
    test('find score', () => {
        const data = [
            { _sum: { score: 140 }, _count: { score: 2 }, playerId: 'A' },
            { _sum: { score: 10 }, _count: { score: 1 }, playerId: 'B' }
          ]

          expect(findScore(data, "A")._sum.score).toBe(140);
          expect(findScore(data, "B")._count.score).toBe(1);
          expect(() => findScore(data, "C")).toThrow(Error)
    })
})