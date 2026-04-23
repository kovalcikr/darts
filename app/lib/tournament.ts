'use server'

import { redirect } from "next/navigation";
import getTournamentInfo from "./cuescore";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { upsertTournament, findTournamentsBySeason } from "./data";
import type { CueScoreTournament } from "./integrations/cuescore/types";
import { inferTournamentSeason, parseTournamentDate } from "./tournament-metadata";

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
    season?: number | string
    year?: number | string
    eventDate?: string | number | Date
    startDate?: string | number | Date
    startTime?: string | number | Date
    date?: string | number | Date
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
    const eventDate = parseTournamentDate(
        tournament?.eventDate ??
        tournament?.startDate ??
        tournament?.startTime ??
        tournament?.date
    );
    const season = inferTournamentSeason({
        explicitSeason: tournament?.season ?? tournament?.year,
        eventDate,
        name,
    });

    if (!tournamentId || !name) {
        throw new Error(
            `Invalid tournament payload from CueScore: ${JSON.stringify(tournament ?? null)}`
        );
    }

    return {
        tournamentId: String(tournamentId),
        name: String(name),
        season,
        eventDate,
    };
}

export async function createTournament(tournament: TournamentLike, requestedTournamentId?: string) {
    const normalizedTournament = normalizeTournament(tournament, requestedTournamentId);
    return upsertTournament(normalizedTournament.tournamentId, {
        name: normalizedTournament.name,
        season: normalizedTournament.season,
        eventDate: normalizedTournament.eventDate,
    });
}

export async function getTournaments(year: string) {
    const season = Number.parseInt(year, 10);
    if (Number.isNaN(season)) {
        return [];
    }

    const tournamentIds = await findTournamentsBySeason(season);
    const tournaments = tournamentIds.map(tournament => tournament.id);
    return tournaments
}

export const getCachedTournaments = unstable_cache(
    async (year: string) => {
        const season = Number.parseInt(year, 10);
        if (Number.isNaN(season)) {
            return [];
        }

        return await findTournamentsBySeason(season);
    },
    ['tournaments-by-year'],
    { tags: ["tournaments"] }
);
