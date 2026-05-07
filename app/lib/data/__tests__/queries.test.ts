import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Test the queries module interface
describe('data/queries', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('exports findMatch function', async () => {
        const queries = await import('../queries');
        expect(typeof queries.findMatch).toBe('function');
    });

    test('exports activeThrowWhere function', async () => {
        const queries = await import('../queries');
        expect(typeof queries.activeThrowWhere).toBe('function');
    });

    test('exports findThrowsByMatch function', async () => {
        const queries = await import('../queries');
        expect(typeof queries.findThrowsByMatch).toBe('function');
    });
});