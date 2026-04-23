import prisma from '../app/lib/db'
import { inferTournamentSeasonFromName } from '../app/lib/tournament-metadata'

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
