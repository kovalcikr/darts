'use server'

import getTournamentInfo from "./cuescore"
import { revalidatePath, revalidateTag } from "next/cache";
import { FullMatch, Player } from "./model/fullmatch";
import { findLastThrow, findMatchAvg } from "./playerThrow";
import { findMatch, findThrowsByMatch, findThrowsByMatchAndLeg, findActiveThrowsByMatchAndLeg, findHighestScoreInMatch, findBestCheckoutInMatch, findBestLegInMatch, findScoreboardThrowHistory, upsertMatch, updateMatchFirstPlayer } from "./data";
import { findMatchLiveStates, refreshMatchLiveState } from "./match-live-state";
import { calculateThreeDartAverage, calculateLegState } from "./scoring";
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

export async function getCuescoreMatchCached(tournamentId: string, tableName: string) {
  console.log('getCuescoreMatchCached', tournamentId, tableName);
  const tournament = await getTournamentInfo(tournamentId);
  for (let match of tournament.matches) {
    if (match.matchstatus == 'playing' && match?.table.name == tableName) {
      match.matchId = String(match.matchId);
      return match;
    }
  }
}

export async function getCuescoreMatch(tournamentId: string, tableName: string) {
  const tournament = await getTournamentInfo(tournamentId);
  for (let match of tournament.matches) {
    if (match.matchstatus == 'playing' && match?.table.name == tableName) return match;
  }
  throw Error(`No match in progress on table ${tableName}`);
}

export async function getFullMatch(matchId) {
   const match = await getMatch(matchId);
  if (!match) {
    return null;
  }
  
  // Try to read from MatchLiveState projection first
  const liveStates = await findMatchLiveStates([matchId]);
  const liveState = liveStates[0] ?? null;
  
  let scores, nextPlayer, startingPlayerId, playerAAvg, playerBAvg, lastThrows;
  
  if (liveState && liveState.matchId === matchId) {
    // Use projection data
    scores = {
      playerA: liveState.playerAScoreLeft,
      playerB: liveState.playerBScoreLeft,
      playerADarts: match.playerALegs > 0 ? 3 : 0, // approximation from leg count
      playerBDarts: match.playerBlegs > 0 ? 3 : 0,
      nextPlayer: liveState.activePlayerId,
    };
    nextPlayer = liveState.activePlayerId;
    startingPlayerId = liveState.startingPlayerId;
    playerAAvg = calculateThreeDartAverage(liveState.playerATotalScore, liveState.playerATotalDarts);
    playerBAvg = calculateThreeDartAverage(liveState.playerBTotalScore, liveState.playerBTotalDarts);
    lastThrows = liveState.lastThrows;
  } else {
    // Fallback to old behavior (for transition period)
    const leg = match.playerALegs + match.playerBlegs + 1;
    const oldScores = await getScores(match.id, leg, match.playerAId, match.playerBId, match.firstPlayer);
    scores = oldScores;
    nextPlayer = oldScores.nextPlayer;
    startingPlayerId = match.firstPlayer;
    playerAAvg = await findMatchAvg(match.id, match.playerAId);
    playerBAvg = await findMatchAvg(match.id, match.playerBId);
    lastThrows = [];
  }
  
  const playerALast = (await findLastThrow(match.id, 1, match.playerAId))?.score;
  const playerBLast = (await findLastThrow(match.id, 1, match.playerBId))?.score;
  const throws = await findThrowsByMatch(matchId);
  const throwHistory = await findScoreboardThrowHistory(match.id, 6);

  const playerA: Player = {
    id: match.playerAId,
    name: match.playerAName,
    imageUrl: match.playerAImage,
    score: scores.playerA,
    dartsCount: scores.playerADarts,
    lastThrow: playerALast,
    matchAvg: playerAAvg,
    legCount: match.playerALegs,
    active: nextPlayer == match.playerAId,
    highestScore: await findHighestScoreInMatch(matchId, match.playerAId),
    bestCheckout: await findBestCheckoutInMatch(matchId, match.playerAId),
    bestLeg: await findBestLegInMatch(matchId, match.playerAId),
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
    active: nextPlayer == match.playerBId,
    highestScore: await findHighestScoreInMatch(matchId, match.playerBId),
    bestCheckout: await findBestCheckoutInMatch(matchId, match.playerBId),
    bestLeg: await findBestLegInMatch(matchId, match.playerBId),
  }

  const fullMatch: FullMatch = {
    match: match,
    tournament: match.tournament,
    currentLeg: match.playerALegs + match.playerBlegs + 1,
    nextPlayer: nextPlayer,
    startingPlayerId: startingPlayerId,
    playerA: playerA,
    playerB: playerB,
    throws: throws,
    throwHistory,
  }
  return fullMatch;
}

export async function getMatch(matchId) {
  return findMatch(matchId);
}

export async function createMatch(match, slot?: string) {
   return await upsertMatch(match, slot);
}

export async function setStartingPlayer(matchId, playerId) {
  return await updateMatchFirstPlayer(matchId, playerId);
}

export async function startMatch(formData) {
    const matchId = formData.get('matchId');
    const firstPlayer = formData.get('firstPlayer');
    const table = formData.get('table');
    
    await prisma.$transaction(async (tx) => {
        await updateMatchFirstPlayer(matchId, firstPlayer, tx);
        await refreshMatchLiveState(matchId, table ?? null, tx);
    });
    
    revalidatePath('/tables/[table]', 'page');
    const cacheTag = `match${table}`
    console.log('revalidating tag', cacheTag)
    revalidateTag(cacheTag, 'max')
}

  export async function getThrows(matchId: string, leg: number, playerA: string, playerB: string) {
  return await findThrowsByMatchAndLeg(matchId, leg, playerA, playerB);
}

export async function getScores(matchId: string, leg: number, playerA: string, playerB: string, firstPlayer: string) {
  const playerThrows = await findActiveThrowsByMatchAndLeg(matchId, leg, playerA, playerB);
  const throws = playerThrows.map((t: any) => ({
    playerId: t.playerId,
    score: t.score,
    darts: t.darts,
  }));

  const state = calculateLegState({
    throws,
    leg,
    playerAId: playerA,
    playerBId: playerB,
    firstPlayer,
  });

  return {
    playerA: state.playerAScoreLeft,
    playerB: state.playerBScoreLeft,
    playerADarts: state.playerADarts,
    playerBDarts: state.playerBDarts,
    nextPlayer: state.nextPlayer,
  };
}
