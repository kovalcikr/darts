import {describe, expect, test, afterEach} from '@jest/globals';
import prisma from '../../app/lib/db';

describe('DB', () => {
  afterEach(async () => {
    await prisma.tournament.deleteMany();
  });

  test('should insert a tournament', async () => {
    const inserted = await prisma.tournament.create({
      data: {
        name: "test tournament"
      }
    });

    const tournament = await prisma.tournament.findUniqueOrThrow({
      where: {
        id: inserted.id
      }
    });

    expect(tournament).toBeDefined();
    expect(tournament.name).toBe("test tournament");
  });
});