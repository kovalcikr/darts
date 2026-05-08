'use server'

import { revalidateScoreboard } from "./revalidation";
import { findMatch, findThrowsByMatch, findHighestScoreInMatch, findBestCheckoutInMatch, findBestLegInMatch, findScoreboardThrowHistory, updateMatchFirstPlayer, aggregateMatchThrows } from "./data";
import { findMatchLiveStates, refreshMatchLiveState } from "./match-live-state";
import { calculateThreeDartAverage } from "./scoring";
import prisma from "./db";
import type { ScoreboardThrowHistoryItem } from "./model/fullmatch";
import type { Match, PlayerThrow, Tournament } from "@/prisma/client";

export type LivePlayer = {
  id: string
  name: string
  imageUrl: string | null
  score: number
  dartsCount: number
  lastThrow: number | null
  matchAvg: number
  legCount: number
  active: boolean
  highestScore: number
  bestCheckout: number
  bestLeg: number
}

export type LiveScoringData = {
  match: Match
  tournament: Tournament | null
  currentLeg: number
  nextPlayer: string
  startingPlayerId: string | null
  playerA: LivePlayer
  playerB: LivePlayer
  throwHistory: ScoreboardThrowHistoryItem[]
}

export type StatPlayer = {
  id: string
  name: string
  imageUrl: string | null
  matchAvg: number
  legCount: number
  highestScore: number
  bestCheckout: number
  bestLeg: number
}

export type MatchDetails = {
  match: Match
  tournament: Tournament | null
  playerA: StatPlayer
  playerB: StatPlayer
  throws: PlayerThrow[]
}

export async function getLiveScoringData(matchId: string): Promise<LiveScoringData | null> {
  const match = await findMatch(matchId);
  if (!match) return null;

  const liveStates = await findMatchLiveStates([matchId]);
  const liveState = liveStates.find(s => s.matchId === matchId) ?? null;

  if (!liveState) {
    const currentLeg = match.playerALegs + match.playerBlegs + 1;
    return {
      match,
      tournament: match.tournament,
      currentLeg,
      nextPlayer: '',
      startingPlayerId: null,
      playerA: {
        id: match.playerAId,
        name: match.playerAName,
        imageUrl: match.playerAImage,
        score: 501,
        dartsCount: 0,
        lastThrow: null,
        matchAvg: 0,
        legCount: match.playerALegs,
        active: false,
        highestScore: 0,
        bestCheckout: 0,
        bestLeg: 0,
      },
      playerB: {
        id: match.playerBId,
        name: match.playerBName,
        imageUrl: match.playerBImage,
        score: 501,
        dartsCount: 0,
        lastThrow: null,
        matchAvg: 0,
        legCount: match.playerBlegs,
        active: false,
        highestScore: 0,
        bestCheckout: 0,
        bestLeg: 0,
      },
      throwHistory: [],
    };
  }

  const playerAAvg = calculateThreeDartAverage(liveState.playerATotalScore, liveState.playerATotalDarts);
  const playerBAvg = calculateThreeDartAverage(liveState.playerBTotalScore, liveState.playerBTotalDarts);
  const playerALast = (liveState.lastThrows ?? []).filter(t => t.playerId === match.playerAId).pop()?.score ?? null;
  const playerBLast = (liveState.lastThrows ?? []).filter(t => t.playerId === match.playerBId).pop()?.score ?? null;
  const throwHistory = await findScoreboardThrowHistory(match.id, 6);
  const currentLeg = match.playerALegs + match.playerBlegs + 1;

  return {
    match,
    tournament: match.tournament,
    currentLeg,
    nextPlayer: liveState.activePlayerId,
    startingPlayerId: liveState.startingPlayerId,
    playerA: {
      id: match.playerAId,
      name: match.playerAName,
      imageUrl: match.playerAImage,
      score: liveState.playerAScoreLeft,
      dartsCount: liveState.playerATotalDarts,
      lastThrow: playerALast,
      matchAvg: playerAAvg,
      legCount: match.playerALegs,
      active: liveState.activePlayerId === match.playerAId,
      highestScore: 0,
      bestCheckout: 0,
      bestLeg: 0,
    },
    playerB: {
      id: match.playerBId,
      name: match.playerBName,
      imageUrl: match.playerBImage,
      score: liveState.playerBScoreLeft,
      dartsCount: liveState.playerBTotalDarts,
      lastThrow: playerBLast,
      matchAvg: playerBAvg,
      legCount: match.playerBlegs,
      active: liveState.activePlayerId === match.playerBId,
      highestScore: 0,
      bestCheckout: 0,
      bestLeg: 0,
    },
    throwHistory,
  };
}

export async function getMatchDetails(matchId: string): Promise<MatchDetails | null> {
  const match = await findMatch(matchId);
  if (!match) return null;

  const [
    throws,
    playerAStats,
    playerBStats,
    playerAHighScore,
    playerBHighScore,
    playerABestCheckout,
    playerBBestCheckout,
    playerABestLeg,
    playerBBestLeg,
  ] = await Promise.all([
    findThrowsByMatch(matchId),
    aggregateMatchThrows(matchId, match.playerAId),
    aggregateMatchThrows(matchId, match.playerBId),
    findHighestScoreInMatch(matchId, match.playerAId),
    findHighestScoreInMatch(matchId, match.playerBId),
    findBestCheckoutInMatch(matchId, match.playerAId),
    findBestCheckoutInMatch(matchId, match.playerBId),
    findBestLegInMatch(matchId, match.playerAId),
    findBestLegInMatch(matchId, match.playerBId),
  ]);

  const playerAAvg = calculateThreeDartAverage(playerAStats._sum.score ?? 0, playerAStats._sum.darts ?? 0);
  const playerBAvg = calculateThreeDartAverage(playerBStats._sum.score ?? 0, playerBStats._sum.darts ?? 0);

  return {
    match,
    tournament: match.tournament,
    playerA: {
      id: match.playerAId,
      name: match.playerAName,
      imageUrl: match.playerAImage,
      matchAvg: playerAAvg,
      legCount: match.playerALegs,
      highestScore: playerAHighScore ?? 0,
      bestCheckout: playerABestCheckout ?? 0,
      bestLeg: playerABestLeg ?? 0,
    },
    playerB: {
      id: match.playerBId,
      name: match.playerBName,
      imageUrl: match.playerBImage,
      matchAvg: playerBAvg,
      legCount: match.playerBlegs,
      highestScore: playerBHighScore ?? 0,
      bestCheckout: playerBBestCheckout ?? 0,
      bestLeg: playerBBestLeg ?? 0,
    },
    throws,
  };
}

export async function startMatch(formData: FormData) {
  const matchId = formData.get('matchId') as string;
  const firstPlayer = formData.get('firstPlayer') as string;
  const table = formData.get('table') as string;

  await prisma.$transaction(async (tx) => {
    await updateMatchFirstPlayer(matchId, firstPlayer, tx);
    await refreshMatchLiveState(matchId, table ?? null, tx);
  });

  revalidateScoreboard(table);
}
