'use server'

import getTournamentInfo from "./cuescore"
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FullMatch, Player } from "./model/fullmatch";
import { findMatch, findThrowsByMatch, findThrowsByMatchAndLeg, findActiveThrowsByMatchAndLeg, findScoreboardThrowHistory, upsertMatch, updateMatchFirstPlayer } from "./data";
import { calculateLegState } from "./scoring";
import { getMatchState } from "./match-state";
import { isMatchComplete } from "./utils/match";
import { revalidateTableById } from "./cache/revalidation";

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

export async function getFullMatch(matchId, _unused?: boolean) {
  const state = await getMatchState(matchId)
  if (!state) {
    return null
  }
  return {
    match: state.match,
    tournament: state.match.tournament,
    currentLeg: state.currentLeg,
    nextPlayer: state.nextPlayer,
    startingPlayerId: state.startingPlayerId,
    playerA: state.playerA as Player,
    playerB: state.playerB as Player,
    throws: state.throws,
    throwHistory: state.throwHistory,
  }
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
   await setStartingPlayer(formData.get('matchId'), formData.get('firstPlayer'));
   const table = formData.get('table');
   await revalidateTableById(table);
   redirect(`/tables/${encodeURIComponent(table)}`);
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
