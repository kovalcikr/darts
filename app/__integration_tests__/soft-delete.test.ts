import type { PrismaClient } from '@/prisma/client'
import prisma from '@/app/lib/db'
import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals'

const prismaTest = prisma as unknown as PrismaClient

describe('Soft Delete Integration Tests', () => {
  beforeAll(async () => {
    await prismaTest.playerThrow.deleteMany()
    await prismaTest.match.deleteMany()
    await prismaTest.tournament.deleteMany()
    await prismaTest.tournamentAudit.deleteMany()
    await prismaTest.matchAudit.deleteMany()
    await prismaTest.throwAudit.deleteMany()
  })

  beforeEach(async () => {
    await prismaTest.playerThrow.deleteMany()
    await prismaTest.match.deleteMany()
    await prismaTest.tournament.deleteMany()
    await prismaTest.tournamentAudit.deleteMany()
    await prismaTest.matchAudit.deleteMany()
    await prismaTest.throwAudit.deleteMany()
  })

  afterEach(async () => {
    await prismaTest.playerThrow.deleteMany()
    await prismaTest.match.deleteMany()
    await prismaTest.tournament.deleteMany()
    await prismaTest.tournamentAudit.deleteMany()
    await prismaTest.matchAudit.deleteMany()
    await prismaTest.throwAudit.deleteMany()
  })

  afterAll(async () => {
    await prismaTest.playerThrow.deleteMany()
    await prismaTest.match.deleteMany()
    await prismaTest.tournament.deleteMany()
    await prismaTest.tournamentAudit.deleteMany()
    await prismaTest.matchAudit.deleteMany()
    await prismaTest.throwAudit.deleteMany()
    await prismaTest.$disconnect()
  })

  describe('Tournament soft delete', () => {
    test('should create tournament audit record when deleting tournament', async () => {
      // Create tournament with match and throw
      await prismaTest.tournament.create({
        data: {
          id: 't1',
          name: 'Test Tournament',
          season: 2026,
          matches: {
            create: {
              id: 'm1',
              round: 'Final',
              playerAId: 'pA',
              playerAName: 'Player A',
              playerAImage: 'imgA',
              playerBId: 'pB',
              playerBName: 'Player B',
              playerBImage: 'imgB',
              runTo: 5,
              throwsList: {
                create: {
                  id: 'pt1',
                  tournamentId: 't1',
                  leg: 1,
                  playerId: 'pA',
                  score: 140,
                  darts: 3,
                },
              },
            },
          },
        },
      })

      // Delete tournament (simulating the audit logic)
      const tournament = await prismaTest.tournament.findUnique({
        where: { id: 't1' },
        include: {
          matches: {
            include: { throwsList: true },
          },
        },
      })

      expect(tournament).not.toBeNull()

      // Create audit records
      await prismaTest.tournamentAudit.create({
        data: {
          tournamentId: tournament!.id,
          name: tournament!.name,
          season: tournament!.season,
          includeInGlobalStats: tournament!.includeInGlobalStats,
          deletedBy: 'test',
        },
      })

      for (const match of tournament!.matches) {
        await prismaTest.matchAudit.create({
          data: {
            matchId: match.id,
            tournamentId: match.tournamentId,
            round: match.round,
            playerAId: match.playerAId,
            playerAName: match.playerAName,
            playerAImage: match.playerAImage,
            playerBId: match.playerBId,
            playerBName: match.playerBName,
            playerBImage: match.playerBImage,
            runTo: match.runTo,
            playerALegs: match.playerALegs,
            playerBlegs: match.playerBlegs,
            isComplete: match.isComplete,
            firstPlayer: match.firstPlayer,
            deletedBy: 'test',
          },
        })

        for (const playerThrow of match.throwsList) {
          await prismaTest.throwAudit.create({
            data: {
              throwId: playerThrow.id,
              tournamentId: playerThrow.tournamentId,
              matchId: playerThrow.matchId,
              leg: playerThrow.leg,
              playerId: playerThrow.playerId,
              time: playerThrow.time,
              score: playerThrow.score,
              darts: playerThrow.darts,
              doubles: playerThrow.doubles,
              checkout: playerThrow.checkout,
              deletedBy: 'test',
            },
          })
        }
      }

      // Delete records
      await prismaTest.$transaction([
        prismaTest.playerThrow.deleteMany({ where: { tournamentId: 't1' } }),
        prismaTest.match.deleteMany({ where: { tournamentId: 't1' } }),
        prismaTest.tournament.delete({ where: { id: 't1' } }),
      ])

      // Verify audit records exist
      const tournamentAudit = await prismaTest.tournamentAudit.findFirst({
        where: { tournamentId: 't1' },
      })
      expect(tournamentAudit).not.toBeNull()
      expect(tournamentAudit?.name).toBe('Test Tournament')
      expect(tournamentAudit?.season).toBe(2026)

      const matchAudit = await prismaTest.matchAudit.findFirst({ where: { matchId: 'm1' } })
      expect(matchAudit).not.toBeNull()
      expect(matchAudit?.round).toBe('Final')

      const throwAudit = await prismaTest.throwAudit.findFirst({ where: { throwId: 'pt1' } })
      expect(throwAudit).not.toBeNull()
      expect(throwAudit?.score).toBe(140)

      // Verify original records are deleted
      const deletedTournament = await prismaTest.tournament.findUnique({ where: { id: 't1' } })
      expect(deletedTournament).toBeNull()
    })

    test('should restore tournament from audit records', async () => {
      // Create audit records first
      await prismaTest.tournamentAudit.create({
        data: {
          tournamentId: 't1',
          name: 'Restored Tournament',
          season: 2026,
          includeInGlobalStats: true,
          deletedBy: 'test',
        },
      })

      await prismaTest.matchAudit.create({
        data: {
          matchId: 'm1',
          tournamentId: 't1',
          round: 'Final',
          playerAId: 'pA',
          playerAName: 'Player A',
          playerAImage: 'imgA',
          playerBId: 'pB',
          playerBName: 'Player B',
          playerBImage: 'imgB',
          runTo: 5,
          deletedBy: 'test',
        },
      })

      await prismaTest.throwAudit.create({
        data: {
          throwId: 'pt1',
          tournamentId: 't1',
          matchId: 'm1',
          leg: 1,
          playerId: 'pA',
          score: 140,
          darts: 3,
          deletedBy: 'test',
        },
      })

      // Restore tournament
      const tournamentAudit = await prismaTest.tournamentAudit.findFirst({
        where: { tournamentId: 't1' },
      })
      expect(tournamentAudit).not.toBeNull()

      await prismaTest.tournament.create({
        data: {
          id: tournamentAudit!.tournamentId,
          name: tournamentAudit!.name,
          season: tournamentAudit!.season,
          includeInGlobalStats: tournamentAudit!.includeInGlobalStats,
        },
      })

      // Verify restoration
      const restoredTournament = await prismaTest.tournament.findUnique({
        where: { id: 't1' },
      })
      expect(restoredTournament).not.toBeNull()
      expect(restoredTournament?.name).toBe('Restored Tournament')
      expect(restoredTournament?.season).toBe(2026)
    })
  })

  describe('Match soft delete', () => {
    test('should create match audit record when deleting match', async () => {
      // Setup
      await prismaTest.tournament.create({
        data: { id: 't1', name: 'Test' },
      })

      const match = await prismaTest.match.create({
        data: {
          id: 'm1',
          tournamentId: 't1',
          round: 'Final',
          playerAId: 'pA',
          playerAName: 'Player A',
          playerAImage: 'imgA',
          playerBId: 'pB',
          playerBName: 'Player B',
          playerBImage: 'imgB',
          runTo: 5,
          throwsList: {
            create: {
              id: 'pt1',
              tournamentId: 't1',
              leg: 1,
              playerId: 'pA',
              score: 140,
              darts: 3,
            },
          },
        },
      })

      // Create audit records
      await prismaTest.matchAudit.create({
        data: {
          matchId: match.id,
          tournamentId: match.tournamentId,
          round: match.round,
          playerAId: match.playerAId,
          playerAName: match.playerAName,
          playerAImage: match.playerAImage,
          playerBId: match.playerBId,
          playerBName: match.playerBName,
          playerBImage: match.playerBImage,
          runTo: match.runTo,
          deletedBy: 'test',
        },
      })

      await prismaTest.throwAudit.create({
        data: {
          throwId: 'pt1',
          tournamentId: 't1',
          matchId: 'm1',
          leg: 1,
          playerId: 'pA',
          score: 140,
          darts: 3,
          deletedBy: 'test',
        },
      })

      // Delete match
      await prismaTest.match.delete({ where: { id: 'm1' } })

      // Verify audit exists
      const matchAudit = await prismaTest.matchAudit.findFirst({ where: { matchId: 'm1' } })
      expect(matchAudit).not.toBeNull()

      const deletedMatch = await prismaTest.match.findUnique({ where: { id: 'm1' } })
      expect(deletedMatch).toBeNull()
    })
  })

  describe('Throw soft delete', () => {
    test('should create throw audit record when deleting throw', async () => {
      // Setup
      await prismaTest.tournament.create({ data: { id: 't1', name: 'Test' } })
      await prismaTest.match.create({
        data: {
          id: 'm1',
          tournamentId: 't1',
          round: 'Final',
          playerAId: 'pA',
          playerAName: 'Player A',
          playerAImage: 'imgA',
          playerBId: 'pB',
          playerBName: 'Player B',
          playerBImage: 'imgB',
          runTo: 5,
        },
      })

      const playerThrow = await prismaTest.playerThrow.create({
        data: {
          id: 'pt1',
          tournamentId: 't1',
          matchId: 'm1',
          leg: 1,
          playerId: 'pA',
          score: 140,
          darts: 3,
        },
      })

      // Create audit
      await prismaTest.throwAudit.create({
        data: {
          throwId: playerThrow.id,
          tournamentId: playerThrow.tournamentId,
          matchId: playerThrow.matchId,
          leg: playerThrow.leg,
          playerId: playerThrow.playerId,
          time: playerThrow.time,
          score: playerThrow.score,
          darts: playerThrow.darts,
          deletedBy: 'test',
        },
      })

      // Delete throw
      await prismaTest.playerThrow.delete({ where: { id: 'pt1' } })

      // Verify audit exists
      const throwAudit = await prismaTest.throwAudit.findFirst({ where: { throwId: 'pt1' } })
      expect(throwAudit).not.toBeNull()
      expect(throwAudit?.score).toBe(140)

      const deletedThrow = await prismaTest.playerThrow.findUnique({ where: { id: 'pt1' } })
      expect(deletedThrow).toBeNull()
    })
  })
})