import prisma from "./db";

export async function getPlayers(tournaments) : Promise<any> {
    const playersA = await prisma.match.findMany({
        where: {
          tournamentId: {
            in: tournaments
          }
        },
        distinct: ["playerAId"],
        select: {
          playerAId: true,
          playerAName: true
        }
      })
      const playersB = await prisma.match.findMany({
        where: {
          tournamentId: {
            in: tournaments
          }
        },
        distinct: ["playerBId"],
        select: {
          playerBId: true,
          playerBName: true
        }
      })
      const players = {};
      playersA.forEach(value => players[value.playerAId] = value.playerAName)
      playersB.forEach(value => players[value.playerBId] = value.playerBName)

      return players;
}