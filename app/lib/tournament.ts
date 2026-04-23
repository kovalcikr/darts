'use server'

import { redirect } from "next/navigation";
import getTournamentInfo from "./cuescore";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { upsertTournament, findTournamentsByName, findTournamentsByYear } from "./data";
import type { CueScoreTournament } from "./integrations/cuescore/types";

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
    await createTournament(tournament, tournamentId);
    revalidateTag("tournaments", "max");
    revalidatePath("/stats/tournaments");
}

type TournamentLike = Partial<CueScoreTournament> & {
    id?: string | number
    tournamentName?: string
    title?: string
}

function normalizeTournament(
    tournament: TournamentLike | undefined,
    requestedTournamentId?: string
) {
    const tournamentId = tournament?.tournamentId ?? tournament?.id ?? requestedTournamentId;
    const name =
        tournament?.name ??
        tournament?.tournamentName ??
        tournament?.title ??
        (tournamentId ? `Local Tournament ${tournamentId}` : undefined);

    if (!tournamentId || !name) {
        throw new Error(
            `Invalid tournament payload from CueScore: ${JSON.stringify(tournament ?? null)}`
        );
    }

    return {
        tournamentId: String(tournamentId),
        name: String(name),
    };
}

export async function createTournament(tournament: TournamentLike, requestedTournamentId?: string) {
    const normalizedTournament = normalizeTournament(tournament, requestedTournamentId);
    return upsertTournament(normalizedTournament.tournamentId, normalizedTournament.name);
}

export async function getTournaments(year: string) {
    if (year === "2024") {
        const tournamentNames = generateTournamentNames(13, 24);
        const tournamentIds = await findTournamentsByName(tournamentNames);
        return tournamentIds.map(tournament => tournament.id);
    }

    const tournamentIds = await findTournamentsByYear(year);
    const tournaments = tournamentIds.map(tournament => tournament.id);
    return tournaments
}

function generateTournamentNames(start, end) {
    const names = [];
    for (let i = start; i <= end; i++) {
        names.push("Relax Darts CUP " + i + " 2024")
    }
    return names;
}

export const getCachedTournaments = unstable_cache(
    async (year: string) => {
        return await findTournamentsByYear(year);
    },
    ['tournaments-by-year'],
    { tags: ["tournaments"] }
);
