import { describe, expect, test } from '@jest/globals';
import { selectCurrentLegStarter } from '../lib/leg-starter';

describe('selectCurrentLegStarter', () => {
    test('uses the first player for odd legs and the other player for even legs', () => {
        expect(selectCurrentLegStarter({
            leg: 1,
            playerAId: 'pA',
            playerBId: 'pB',
            firstPlayer: 'pA',
        })).toBe('pA');

        expect(selectCurrentLegStarter({
            leg: 2,
            playerAId: 'pA',
            playerBId: 'pB',
            firstPlayer: 'pA',
        })).toBe('pB');
    });

    test('returns null when starter data is incomplete', () => {
        expect(selectCurrentLegStarter({
            leg: 1,
            playerAId: 'pA',
            playerBId: 'pB',
            firstPlayer: null,
        })).toBeNull();
    });
});
