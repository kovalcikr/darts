import { describe, expect, test, jest, beforeEach } from '@jest/globals';

describe('data/leg-state', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('exports getSyncedMatchLegState function', async () => {
        const legState = await import('../leg-state');
        expect(typeof legState.getSyncedMatchLegState).toBe('function');
    });
});
