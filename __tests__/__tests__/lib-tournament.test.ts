import {describe, expect, test, jest, beforeEach, afterEach} from '@jest/globals';
import { generateTournamentNames, getTournaments } from '../../app/lib/tournament';
import prisma from '../../app/lib/db';

describe('generateTournamentNames', () => {
  test('should generate a single tournament name', () => {
    const names = generateTournamentNames(1, 1);
    expect(names).toEqual(['Relax Darts CUP 1 2024']);
  });

  test('should generate multiple tournament names', () => {
    const names = generateTournamentNames(1, 3);
    expect(names).toEqual([
      'Relax Darts CUP 1 2024',
      'Relax Darts CUP 2 2024',
      'Relax Darts CUP 3 2024',
    ]);
  });

  test('should handle a larger range', () => {
    const names = generateTournamentNames(10, 12);
    expect(names).toEqual([
      'Relax Darts CUP 10 2024',
      'Relax Darts CUP 11 2024',
      'Relax Darts CUP 12 2024',
    ]);
  });

  test('should return an empty array if start is greater than end', () => {
    const names = generateTournamentNames(3, 1);
    expect(names).toEqual([]);
  });
});

describe('getTournaments', () => {
    beforeEach(async () => {
        await prisma.tournament.deleteMany();
    });

    afterEach(async () => {
        await prisma.tournament.deleteMany();
    });

    test('should return an empty array when no tournaments match', async () => {
        const tournaments = await getTournaments();
        expect(tournaments).toEqual([]);
    });

    test('should return tournaments that match the generated names', async () => {
        await prisma.tournament.create({
            data: { id: '1', name: 'Relax Darts CUP 13 2024' }
        });
        await prisma.tournament.create({
            data: { id: '2', name: 'Relax Darts CUP 14 2024' }
        });
        await prisma.tournament.create({
            data: { id: '3', name: 'Some Other Tournament' }
        });

        const tournaments = await getTournaments();
        expect(tournaments).toHaveLength(2);
        expect(tournaments).toContain('1');
        expect(tournaments).toContain('2');
    });
});
