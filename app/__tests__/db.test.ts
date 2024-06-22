import {describe, expect, test} from '@jest/globals';
import prisma from '../lib/db';
 
describe('Page', () => {
  test('renders a heading', () => {
    expect(2).toBe(2);
  })
})

describe('DB', () => {
  test('should insert tournames', async () => {
    const inserted = await prisma.tournament.create({
      data: {
        name: "test tournament"
      }
    })

    const tournament = await prisma.tournament.findUniqueOrThrow({
      where: {
        id: inserted.id
      }
    })
  })
})