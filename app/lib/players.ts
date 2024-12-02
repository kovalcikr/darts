import { stringify } from "querystring";
import prisma from "./db";

export async function getPlayers(tournaments) : Promise<Map<string, string>> {
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
      const players = new Map();
      playersA.forEach(value => players.set(value.playerAId, value.playerAName))
      playersB.forEach(value => players.set(value.playerBId, value.playerBName))

      return players;
}