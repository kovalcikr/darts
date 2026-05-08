'use server'

import getTournamentInfo from "@/app/lib/cuescore";
import { upsertMatch } from "@/app/lib/data";

export async function ingestCuescoreMatch(tournamentId: string, tableName: string, slot?: string) {
  const tournament = await getTournamentInfo(tournamentId);
  for (const match of tournament.matches) {
    if (match.matchstatus === 'playing' && match?.table?.name === tableName) {
      return await upsertMatch(match, slot);
    }
  }
  throw new Error(`No match in progress on table ${tableName}`);
}