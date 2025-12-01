'use server'

import { redirect } from "next/navigation";
import getTournamentInfo from "./cuescore";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { upsertTournament, findTournamentsByName, findTournamentsByYear } from "./data";

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

export async function getTournaments(year: string) {
    const start = year === "2024" ? 13 : 1;
    const tournamentNames = generateTournamentNames(start, 24, year);

    const tournamentIds = await findTournamentsByName(tournamentNames);
    const tournaments = tournamentIds.map(tourament => tourament.id);
    return tournaments
}

function generateTournamentNames(start, end, year) {
    const names = [];
    for (let i = start; i <= end; i++) {
        names.push(`Relax Darts CUP ${i} ${year}`)
    }
    return names;
}

export const getCachedTournaments = (year: string) => unstable_cache(
    async () => {
        return await findTournamentsByYear(year);
    },
    null,
    { tags: ["tournaments"] }
);