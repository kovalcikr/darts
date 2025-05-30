'use server'

import getTournamentInfo from "./cuescore"
import prisma from "./db";
import { revalidatePath, revalidateTag } from "next/cache";
import { FullMatch, Player } from "./model/fullmatch";
import { findLastThrow, findMatchAvg } from "./playerThrow";

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

export async function getCuescoreMatchCached(tournamentId: string, tableName: string) {
  console.log('getCuescoreMatchCached', tournamentId, tableName);
  const tournament = await getTournamentInfo(tournamentId);
  for (let match of tournament.matches) {
    if (match.matchstatus == 'playing' && match?.table.name == tableName) return match;
  }
}

export async function getCuescoreMatch(tournamentId: string, tableName: string) {
  const tournament = await getTournamentInfo(tournamentId);
  for (let match of tournament.matches) {
    if (match.matchstatus == 'playing' && match?.table.name == tableName) return match;
  }
  throw Error(`No match in progress on table ${tableName}`);
}

export async function getFullMatch(matchId, slow) {
  if (slow) {
    await new Promise(resolve => setTimeout(resolve, 2000));  // TODO: remove
  }
  const match = await getMatch(matchId);
  const leg = match.playerALegs + match.playerBlegs + 1;
  const scores = await getScores(match.id, leg, match.playerAId, match.playerBId, match.firstPlayer);
  const playerALast = (await findLastThrow(match.id, leg, match.playerAId))?.score;
  const playerBLast = (await findLastThrow(match.id, leg, match.playerBId))?.score;
  const playerAAvg = (await findMatchAvg(match.id, match.playerAId));
  const playerBAvg = (await findMatchAvg(match.id, match.playerBId));

  const playerA: Player = {
    id: match.playerAId,
    name: match.playerAName,
    imageUrl: match.playerAImage,
    score: scores.playerA,
    dartsCount: scores.playerADarts,
    lastThrow: playerALast,
    matchAvg: playerAAvg,
    legCount: match.playerALegs,
    active: scores.nextPlayer == match.playerAId
  }

  const playerB: Player = {
    id: match.playerBId,
    name: match.playerBName,
    imageUrl: match.playerBImage,
    score: scores.playerB,
    dartsCount: scores.playerBDarts,
    lastThrow: playerBLast,
    matchAvg: playerBAvg,
    legCount: match.playerBlegs,
    active: scores.nextPlayer == match.playerBId
  }

  const fullMatch: FullMatch = {
    match: match,
    tournament: match.tournament,
    currentLeg: leg,
    nextPlayer: scores.nextPlayer,
    playerA: playerA,
    playerB: playerB
  }
  return fullMatch;
}

export async function getMatch(matchId) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true }
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
      round: match.roundName,
      runTo: match.raceTo
    },
    update: {
      playerAId: String(match.playerA.playerId),
      playerAName: match.playerA.name,
      playerAImage: match.playerA.image,
      playerBId: String(match.playerB.playerId),
      playerBName: match.playerB.name,
      playerBImage: match.playerB.image,
      round: match.roundName,
      runTo: match.raceTo
    },
    where: {
      id: String(match.matchId)
    }
  });
}

export async function setStartingPlayer(matchId, playerId) {
  return await prisma.match.update({
    data: {
      firstPlayer: playerId
    }, where: {
      id: matchId
    }
  });
}

export async function startMatch(formData) {
  await setStartingPlayer(formData.get('matchId'), formData.get('firstPlayer'));
  revalidatePath('/tournaments/[id]/tables/[table]', 'page');
  const cacheTag = `match${formData.get('table')}`
  console.log('revalidating tag', cacheTag)
  revalidateTag(cacheTag)
}

export async function resetMatch(formData) {
  await prisma.match.update({
    data: {
      firstPlayer: null,
      playerALegs: 0,
      playerBlegs: 0,
      throwsList: {
        deleteMany: {
        }
      }
    },
    where: {
      id: formData.get('matchId')
    }
  })
  revalidatePath('/tournaments/[id]/tables/[table]', 'layout');
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
    return ({
      playerA: 501,
      playerB: 501,
      playerADarts: 0,
      playerBDarts: 0,
      nextPlayer: await nextPlayer(leg, 0, 0, playerA, playerB, firstPlayer)
    })
  }
  console.log(playerThrows)
  const playerAScore = await findScore(playerThrows, playerA);
  const playerBScore = await findScore(playerThrows, playerB);
  return {
    playerA: 501 - (playerAScore?._sum.score ? playerAScore?._sum.score : 0),
    playerB: 501 - (playerBScore?._sum.score ? playerBScore?._sum.score : 0),
    playerADarts: playerAScore?._count.score ? playerAScore._count.score * 3 : 0,
    playerBDarts: playerBScore?._count.score ? playerBScore._count.score * 3 : 0,
    nextPlayer: await nextPlayer(leg, playerAScore?._count.score, playerBScore?._count.score, playerA, playerB, firstPlayer)
  }
}

export async function findScore(playerThrows, player) {
  for (var playerThrow of playerThrows) {
    if (playerThrow.playerId == player)
      return playerThrow;
  }
}

/**
 * Calculate next player
 * @param leg 
 * @param throwsA 
 * @param throwsB 
 * @returns 0 if next is playerA, 1 if next is playerB
 */
export async function nextPlayer(leg: number, throwsA: number, throwsB: number, playerA: string, playerB: string, firstPlayer: string) {
  if ((leg + (throwsA ? throwsA : 0) + (throwsB ? throwsB : 0)) % 2 == 1) {
    return firstPlayer;
  } else {
    return firstPlayer == playerA ? playerB : playerA;
  }
}