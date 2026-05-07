import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Test the match-operations module interface
describe('data/match-operations', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('exports refreshMatchLiveState function', async () => {
        const ops = await import('../match-operations');
        expect(typeof ops.refreshMatchLiveState).toBe('function');
    });

    test('exports getSyncedMatchLegState function', async () => {
        const ops = await import('../match-operations');
        expect(typeof ops.getSyncedMatchLegState).toBe('function');
    });
});