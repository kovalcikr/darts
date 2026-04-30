import { describe, expect, test } from '@jest/globals';
import { getAllowedCheckoutDarts } from '../lib/checkout-darts';

describe('getAllowedCheckoutDarts', () => {
    test.each([
        [131, [3]],
        [40, [1, 2, 3]],
        [32, [1, 2, 3]],
        [2, [1, 2, 3]],
        [50, [1, 2, 3]],
        [169, []],
        [170, [3]],
        [100, [2, 3]],
    ])('returns allowed checkout darts for %i', (remainingScore, expected) => {
        expect(getAllowedCheckoutDarts(remainingScore)).toEqual(expected);
    });

    test.each([168, 166, 165, 163, 162, 159])('%i is not a legal three-dart checkout', (remainingScore) => {
        expect(getAllowedCheckoutDarts(remainingScore)).toEqual([]);
    });
});
