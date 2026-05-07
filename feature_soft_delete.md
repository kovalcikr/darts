# Soft Delete Implementation Plan

## Overview
Implement audit trail tables for tournaments, matches, and throws to enable recoverable deletions in admin. Undo/redo operations continue to use existing `undoneAt` and `redoInvalidatedAt` fields on `PlayerThrow`.

## Schema Changes (`prisma/schema.prisma`)

Add three new audit models after the `Tournament` model:

```prisma
model TournamentAudit {
  id                   String    @id @default(cuid())
  tournamentId         String    // original ID for restoration
  name                 String
  season               Int?
  eventDate            DateTime?
  includeInGlobalStats Boolean   @default(true)
  deletedAt            DateTime  @default(now())
  deletedBy            String?   // username or session identifier

  @@index([tournamentId])
  @@index([deletedAt])
}

model MatchAudit {
  id            String   @id @default(cuid())
  matchId       String   // original ID for restoration
  tournamentId  String?
  round         String
  playerAId     String
  playerAName   String
  playerAImage  String
  playerBId     String
  playerBName   String
  playerBImage  String
  runTo         Int
  playerALegs   Int      @default(0)
  playerBlegs   Int      @default(0)
  isComplete    Boolean  @default(false)
  firstPlayer   String?
  deletedAt     DateTime @default(now())
  deletedBy     String?

  @@index([matchId])
  @@index([tournamentId])
  @@index([deletedAt])
}

model ThrowAudit {
  id           String   @id @default(cuid())
  throwId      String   // original ID for restoration
  tournamentId String
  matchId      String
  leg          Int
  playerId     String
  time         DateTime @default(now())
  score        Int
  darts        Int      @default(3)
  doubles      Int?
  checkout     Boolean  @default(false)
  deletedAt    DateTime @default(now())
  deletedBy    String?

  @@index([throwId])
  @@index([tournamentId])
  @@index([matchId])
  @@index([deletedAt])
}
```

## Migration Commands

```bash
# Apply schema changes to database
npx prisma migrate dev --name add_audit_tables

# Or for production
npx prisma migrate deploy
```

## Updated Delete Actions (`app/admin/actions.ts`)

### modify `deleteTournamentAction`

```typescript
export async function deleteTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            throwsList: true,
          },
        },
      },
    })

    if (!tournament) {
      throw new Error(`Tournament ${id} was not found.`)
    }

    // Store tournament in audit table
    await prisma.tournamentAudit.create({
      data: {
        tournamentId: tournament.id,
        name: tournament.name,
        season: tournament.season,
        eventDate: tournament.eventDate,
        includeInGlobalStats: tournament.includeInGlobalStats,
        deletedBy: 'admin', // TODO: get from session
      },
    })

    // Store all matches in audit tables
    for (const match of tournament.matches) {
      await prisma.matchAudit.create({
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
          deletedBy: 'admin',
        },
      })

      // Store all throws in audit table
      for (const playerThrow of match.throwsList) {
        await prisma.throwAudit.create({
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
            deletedBy: 'admin',
          },
        })
      }
    }

    // Now perform the actual deletion
    await prisma.$transaction([
      prisma.playerThrow.deleteMany({
        where: { tournamentId: id },
      }),
      prisma.match.deleteMany({
        where: { tournamentId: id },
      }),
      prisma.tournament.delete({
        where: { id },
      }),
    ])
    await clearActiveTournamentIfMatches(id)

    revalidateSharedPaths()
    revalidateAdminPaths([], [id])
    revalidateTournamentPaths([id])
    revalidateActiveTournamentPaths()
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Tournament deleted.')
}
```

### modify `deleteMatchAction`

```typescript
export async function deleteMatchAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        throwsList: true,
      },
    })

    if (!existingMatch) {
      throw new Error(`Match ${id} was not found.`)
    }

    // Store match in audit table
    await prisma.matchAudit.create({
      data: {
        matchId: existingMatch.id,
        tournamentId: existingMatch.tournamentId,
        round: existingMatch.round,
        playerAId: existingMatch.playerAId,
        playerAName: existingMatch.playerAName,
        playerAImage: existingMatch.playerAImage,
        playerBId: existingMatch.playerBId,
        playerBName: existingMatch.playerBName,
        playerBImage: existingMatch.playerBImage,
        runTo: existingMatch.runTo,
        playerALegs: existingMatch.playerALegs,
        playerBlegs: existingMatch.playerBlegs,
        isComplete: existingMatch.isComplete,
        firstPlayer: existingMatch.firstPlayer,
        deletedBy: 'admin',
      },
    })

    // Store all throws in audit table
    for (const playerThrow of existingMatch.throwsList) {
      await prisma.throwAudit.create({
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
          deletedBy: 'admin',
        },
      })
    }

    await prisma.match.delete({
      where: { id },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([id], [existingMatch.tournamentId])
    revalidateTournamentPaths([existingMatch.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Match deleted.')
}
```

### modify `deleteThrowAction`

```typescript
export async function deleteThrowAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const existingThrow = await prisma.playerThrow.findUnique({
      where: { id },
    })

    if (!existingThrow) {
      throw new Error(`Throw ${id} was not found.`)
    }

    // Store throw in audit table
    await prisma.throwAudit.create({
      data: {
        throwId: existingThrow.id,
        tournamentId: existingThrow.tournamentId,
        matchId: existingThrow.matchId,
        leg: existingThrow.leg,
        playerId: existingThrow.playerId,
        time: existingThrow.time,
        score: existingThrow.score,
        darts: existingThrow.darts,
        doubles: existingThrow.doubles,
        checkout: existingThrow.checkout,
        deletedBy: 'admin',
      },
    })

    await prisma.playerThrow.delete({
      where: { id },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([existingThrow.matchId], [existingThrow.tournamentId])
    revalidateTournamentPaths([existingThrow.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Throw deleted.')
}
```

## New Restore Actions (`app/admin/actions.ts`)

### add `restoreTournamentAction`

```typescript
export async function restoreTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const tournamentId = requireString(formData, 'tournamentId')
    const tournamentAudit = await prisma.tournamentAudit.findFirst({
      where: { tournamentId },
      orderBy: { deletedAt: 'desc' },
    })

    if (!tournamentAudit) {
      throw new Error(`Tournament audit ${tournamentId} was not found.`)
    }

    // Create tournament from audit
    const tournament = await prisma.tournament.create({
      data: {
        id: tournamentAudit.tournamentId,
        name: tournamentAudit.name,
        season: tournamentAudit.season,
        eventDate: tournamentAudit.eventDate,
        includeInGlobalStats: tournamentAudit.includeInGlobalStats,
      },
    })

    // Get all match audits for this tournament
    const matchAudits = await prisma.matchAudit.findMany({
      where: { tournamentId },
    })

    for (const matchAudit of matchAudits) {
      // Create match from audit
      const match = await prisma.match.create({
        data: {
          id: matchAudit.matchId,
          tournamentId: matchAudit.tournamentId,
          round: matchAudit.round,
          playerAId: matchAudit.playerAId,
          playerAName: matchAudit.playerAName,
          playerAImage: matchAudit.playerAImage,
          playerBId: matchAudit.playerBId,
          playerBName: matchAudit.playerBName,
          playerBImage: matchAudit.playerBImage,
          runTo: matchAudit.runTo,
          playerALegs: matchAudit.playerALegs,
          playerBlegs: matchAudit.playerBlegs,
          isComplete: matchAudit.isComplete,
          firstPlayer: matchAudit.firstPlayer,
        },
      })

      // Get all throw audits for this match
      const throwAudits = await prisma.throwAudit.findMany({
        where: { matchId: matchAudit.matchId },
      })

      for (const throwAudit of throwAudits) {
        await prisma.playerThrow.create({
          data: {
            id: throwAudit.throwId,
            tournamentId: throwAudit.tournamentId,
            matchId: throwAudit.matchId,
            leg: throwAudit.leg,
            playerId: throwAudit.playerId,
            time: throwAudit.time,
            score: throwAudit.score,
            darts: throwAudit.darts,
            doubles: throwAudit.doubles,
            checkout: throwAudit.checkout,
          },
        })
      }
    }

    // Delete audit records
    await prisma.$transaction([
      prisma.throwAudit.deleteMany({ where: { tournamentId } }),
      prisma.matchAudit.deleteMany({ where: { tournamentId } }),
      prisma.tournamentAudit.deleteMany({ where: { tournamentId } }),
    ])

    revalidateSharedPaths()
    revalidateAdminPaths([], [tournament.id])
    revalidateTournamentPaths([tournament.id])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Tournament restored.')
}
```

### add `restoreMatchAction`

```typescript
export async function restoreMatchAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const matchId = requireString(formData, 'matchId')
    const matchAudit = await prisma.matchAudit.findFirst({
      where: { matchId },
      orderBy: { deletedAt: 'desc' },
    })

    if (!matchAudit) {
      throw new Error(`Match audit ${matchId} was not found.`)
    }

    // Create match from audit
    const match = await prisma.match.create({
      data: {
        id: matchAudit.matchId,
        tournamentId: matchAudit.tournamentId,
        round: matchAudit.round,
        playerAId: matchAudit.playerAId,
        playerAName: matchAudit.playerAName,
        playerAImage: matchAudit.playerAImage,
        playerBId: matchAudit.playerBId,
        playerBName: matchAudit.playerBName,
        playerBImage: matchAudit.playerBImage,
        runTo: matchAudit.runTo,
        playerALegs: matchAudit.playerALegs,
        playerBlegs: matchAudit.playerBlegs,
        isComplete: matchAudit.isComplete,
        firstPlayer: matchAudit.firstPlayer,
      },
    })

    // Get all throw audits for this match
    const throwAudits = await prisma.throwAudit.findMany({
      where: { matchId },
    })

    for (const throwAudit of throwAudits) {
      await prisma.playerThrow.create({
        data: {
          id: throwAudit.throwId,
          tournamentId: throwAudit.tournamentId,
          matchId: throwAudit.matchId,
          leg: throwAudit.leg,
          playerId: throwAudit.playerId,
          time: throwAudit.time,
          score: throwAudit.score,
          darts: throwAudit.darts,
          doubles: throwAudit.doubles,
          checkout: throwAudit.checkout,
        },
      })
    }

    // Delete audit records
    await prisma.$transaction([
      prisma.throwAudit.deleteMany({ where: { matchId } }),
      prisma.matchAudit.delete({ where: { id: matchAudit.id } }),
    ])

    revalidateSharedPaths()
    revalidateAdminPaths([match.id], [matchAudit.tournamentId].filter(Boolean) as string[])
    revalidateTournamentPaths([matchAudit.tournamentId].filter(Boolean) as string[])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Match restored.')
}
```

### add `restoreThrowAction`

```typescript
export async function restoreThrowAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const throwId = requireString(formData, 'throwId')
    const throwAudit = await prisma.throwAudit.findFirst({
      where: { throwId },
      orderBy: { deletedAt: 'desc' },
    })

    if (!throwAudit) {
      throw new Error(`Throw audit ${throwId} was not found.`)
    }

    // Create throw from audit
    const playerThrow = await prisma.playerThrow.create({
      data: {
        id: throwAudit.throwId,
        tournamentId: throwAudit.tournamentId,
        matchId: throwAudit.matchId,
        leg: throwAudit.leg,
        playerId: throwAudit.playerId,
        time: throwAudit.time,
        score: throwAudit.score,
        darts: throwAudit.darts,
        doubles: throwAudit.doubles,
        checkout: throwAudit.checkout,
      },
    })

    // Delete audit record
    await prisma.throwAudit.delete({
      where: { id: throwAudit.id },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([throwAudit.matchId], [throwAudit.tournamentId])
    revalidateTournamentPaths([throwAudit.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Throw restored.')
}
```

## UI Updates

### Admin Tournament List (`/admin/page.tsx`)
Add restore button next to delete:
```tsx
{/* After the delete form */}
{isDeletedTournament(tournament.id) ? (
  <form action={restoreTournamentAction}>
    <input name="returnTo" type="hidden" value={returnTo} />
    <input name="tournamentId" type="hidden" value={tournament.id} />
    <ActionButton tone="success">Restore Tournament</ActionButton>
  </form>
) : (
  <form action={deleteTournamentAction}>
    {/* existing delete form */}
  </form>
)}
```

### Admin Tournament Detail (`/admin/tournaments/[id]/page.tsx`)
Similar pattern for match restore buttons.

### Admin Match Detail (`/admin/matches/[id]/page.tsx`)
Similar pattern for throw restore in the throw cell.

## Testing

1. Run unit tests: `npm test`
2. Run integration tests: `npm run test:integration`
3. Test manually:
   - Delete a tournament, verify audit records created
   - Restore tournament, verify data restored
   - Verify audit records deleted after restore