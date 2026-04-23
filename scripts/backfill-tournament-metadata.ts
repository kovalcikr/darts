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
      season: null,
    },
    select: {
      id: true,
      name: true,
      eventDate: true,
    },
  })

  let updatedCount = 0

  for (const tournament of tournaments) {
    const season =
      tournament.eventDate?.getFullYear() ??
      inferTournamentSeasonFromName(tournament.name)

    if (season === null) {
      continue
    }

    await prisma.tournament.update({
      where: {
        id: tournament.id,
      },
      data: {
        season,
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
