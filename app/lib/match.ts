'use server'

import { db } from "@vercel/postgres"
import getTournamentInfo from "./cuescore"
import prisma from "./db";
import { revalidatePath } from "next/cache";

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
  return prisma.match.findUnique({
    where: {id: matchId},
    include: {tournament: true}
  })
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

export async function setStartingPlayer(matchId, playerId) {
  return await prisma.match.update({data: {
    firstPlayer: playerId
  }, where: {
    id: matchId
  }});
}

export async function startMatch(formData) {
  await setStartingPlayer(formData.get('matchId'), formData.get('firstPlayer'));
  revalidatePath('/tournaments/[id//tables/[table]');
}

export async function resetMatch(formData) {
  await prisma.match.update({
    data: {
      firstPlayer: null,
      playerALegs: 0,
      playerBlegs: 0
    },
    where: {
      id: formData.get('matchId')
    }
  })
  revalidatePath('/tournaments/[id//tables/[table]');
}

export async function getThrows(matchId: string, leg: number, playerA: string, playerB: string) {
  return await prisma.playerThrow.groupBy({
    by: ['playerId'],
    _sum: {
      score: true
    },
    _count: {
      score: true
    },
    where: {
      matchId: matchId,
      leg: leg,
      playerId: {
        in: [playerA, playerB]
      }
    }
  });
}

export async function getScores(matchId: string, leg: number, playerA: string, playerB: string, firstPlayer: string) {
  const playerThrows = await getThrows(matchId, leg, playerA, playerB);
  if (playerThrows.length == 0) {
    return({
      playerA: 501,
      playerB: 501,
      nextPlayer: await nextPlayer(leg, 0,0, playerA, playerB, firstPlayer)
    })
  }
  const playerAScore = await findScore(playerThrows, playerA);
  const playerBScore = await findScore(playerThrows, playerB);
  return {
    playerA: 501 - playerAScore._sum.score,
    playerB: 501 - playerBScore._sum.soure,
    nextPlayer: await nextPlayer(leg, playerAScore._count.score, playerBScore._count.score, playerA, playerB, firstPlayer)
  }
}

export async function findScore(playerThrows, player) {
  for (var playerThrow of playerThrows) {
    if (playerThrow.playerId == player)
      return playerThrow;
  }
  throw Error('no player throw found');
}

/**
 * Calculate next player
 * @param leg 
 * @param throwsA 
 * @param throwsB 
 * @returns 0 if next is playerA, 1 if next is playerB
 */
export async function nextPlayer(leg: number, throwsA: number, throwsB: number, playerA: string, playerB: string, firstPlayer: string) {
  if ((leg + throwsA + throwsB) % 2 == 1) {
    return firstPlayer;
  } else {
    return firstPlayer == playerA ? playerB : playerA;
  }
}