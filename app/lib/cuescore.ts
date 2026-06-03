'use server'

import { revalidatePath, revalidateTag } from "next/cache";
import { getCueScoreGateway } from "./integrations/cuescore";

export default async function getTournamentInfo(tournamentId : string) {
    return getCueScoreGateway().getTournament(tournamentId);
}

export async function setScore(tournamentId, matchId, playerALegs, playerBlegs) {
  return getCueScoreGateway().updateMatchScore({
    tournamentId,
    matchId,
    scoreA: playerALegs,
    scoreB: playerBlegs,
  });
}

export async function finishMatch(tournamentId, matchId, playerALegs, playerBlegs, table) {
  await getCueScoreGateway().finishMatch({
    tournamentId,
    matchId,
    scoreA: playerALegs,
    scoreB: playerBlegs,
  });
  revalidatePath(`/stats/tournaments/${tournamentId}`);
  revalidatePath('/tables/[table]', 'page');
  const cacheTag = `match${table}`
  console.log('revalidating tag', cacheTag)
  revalidateTag(cacheTag, 'max')
}

export async function getRankings(rankingId: string) {
  return getCueScoreGateway().getRanking(rankingId)
}

export async function getResults(tournamentId: string) {
  return getCueScoreGateway().getResults(tournamentId)
}
