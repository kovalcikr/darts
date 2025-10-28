'use server'

import { redirect } from "next/navigation";
import getTournamentInfo from "./cuescore";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { upsertTournament, findTournamentsByYear, getSeasons as getSeasonsFromDb } from "./data";

export async function getSeasons() {
    return getSeasonsFromDb();
}

export async function openTournamentForm(prevState: any, data: FormData) {
    const tournamentId = data.get('tournamentId') as string;
    try {
        await openTournament(tournamentId);
    } catch (e) {
        return { message: `Cannot open tournament: ${e.message}` }
    }
    redirect(`/tournaments/${tournamentId}`);
}

export async function openTournament(tournamentId: string) {
    const tournament = await getTournamentInfo(tournamentId);
    await createTournament(tournament);
    revalidateTag("tournaments");
    revalidatePath("/stats/tournaments");
}

export async function createTournament({ tournamentId, name }) {
    return upsertTournament(String(tournamentId), name);
}

export async function getTournaments(season: string) {
    const tournamentIds = await findTournamentsByYear(season);
    const tournaments = tournamentIds.map(tourament => tourament.id);
    return tournaments
}

export const getCachedTournaments = (season: string) => unstable_cache(
    async () => {
        return await findTournamentsByYear(season);
    },
    null,
    { tags: ["tournaments", `tournaments:${season}`] }
);