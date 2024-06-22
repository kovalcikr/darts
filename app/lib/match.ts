import { db } from "@vercel/postgres"
import getTournamentInfo from "./cuescore"
import prisma from "./db";

interface CueScorePlayer {
  playerId: number;
  name: string;
  image: string;
}

interface CueScoreMatch {
  matchId: number;
  roundName: string;
  round: number;
  playerA: CueScorePlayer;
  playerB: CueScorePlayer;
  raceTo: number;
  tournamentId: number
}

export async function getCuescoreMatch(tournamentId : string, tableName: string) {
    const tournament = await getTournamentInfo(tournamentId);
    for (let match of tournament.matches) {
      if (match.matchstatus == 'playing' && match?.table.name == tableName) return match;
    }
    throw Error(`No match in progress on table ${tableName}`);
}

export async function getMatch(matchId) {
  return prisma.match.findUnique({where: {id: matchId}})
}

export async function createMatch(match) {
  return await prisma.match.upsert({
    create: {
      id: String(match.matchId),
      tournamentId: String(match.tournamentId),
      playerAId: String(match.playerA.playerId),
      playerAName: match.playerA.name,
      playerAImage: match.playerA.image,
      playerBId: String(match.playerB.playerId),
      playerBName: match.playerB.name,
      playerBImage: match.playerB.image,
      round: `${match.roundName} (${match.round})`,
      runTo: match.raceTo
    },
    update: {
      playerAId: String(match.playerA.playerId),
      playerAName: match.playerA.name,
      playerAImage: match.playerA.image,
      playerBId: String(match.playerB.playerId),
      playerBName: match.playerB.name,
      playerBImage: match.playerB.image,
      round: `${match.roundName} (${match.round})`,
      runTo: match.raceTo
    },
    where: {
      id: String(match.matchId)
    }
  });
}