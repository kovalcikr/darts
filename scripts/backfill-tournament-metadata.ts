import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/client'
import { getDatabaseUrl } from '../app/lib/database-url'
import { inferTournamentSeasonFromName } from '../app/lib/tournament-metadata'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
})

async function main() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { season: null },
        { eventDate: null },
      ],
    },
    select: {
      id: true,
      name: true,
      season: true,
      eventDate: true,
    },
  })

  let updatedCount = 0

  for (const tournament of tournaments) {
    const firstThrow = tournament.eventDate
      ? null
      : await prisma.playerThrow.findFirst({
          where: {
            tournamentId: tournament.id,
          },
          orderBy: {
            time: 'asc',
          },
          select: {
            time: true,
          },
        })

    // The earliest recorded throw corresponds to the first started match.
    const eventDate = tournament.eventDate ?? firstThrow?.time ?? null
    const season =
      tournament.season ??
      eventDate?.getFullYear() ??
      inferTournamentSeasonFromName(tournament.name)

    if (season === tournament.season && eventDate?.getTime() === tournament.eventDate?.getTime()) {
      continue
    }

    await prisma.tournament.update({
      where: {
        id: tournament.id,
      },
      data: {
        season,
        eventDate,
      },
    })
    updatedCount += 1
  }

  console.log(`Backfilled tournament metadata for ${updatedCount} tournament(s).`)
}

main()
  .catch((error) => {
    console.error('Failed to backfill tournament metadata.', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
