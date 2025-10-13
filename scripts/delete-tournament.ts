import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tournamentId = process.argv[2];

  if (!tournamentId) {
    console.error('Please provide a tournament ID.');
    process.exit(1);
  }

  try {
    // First, delete all matches associated with the tournament.
    // This will also cascade delete all PlayerThrow records.
    await prisma.match.deleteMany({
      where: {
        tournamentId: tournamentId,
      },
    });
    console.log(`Successfully deleted matches for tournament ${tournamentId}`);

    // Then, delete the tournament itself.
    await prisma.tournament.delete({
      where: {
        id: tournamentId,
      },
    });
    console.log(`Successfully deleted tournament ${tournamentId}`);

  } catch (error) {
    console.error(`An error occurred while deleting tournament ${tournamentId}:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();