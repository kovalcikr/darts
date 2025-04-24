'use server'

import { redirect } from "next/navigation";
import prisma from "./db";
import getTournamentInfo from "./cuescore";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

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
    return prisma.tournament.upsert({
        create: {
            id: String(tournamentId),
            name: name
        },
        update: {
            name: name
        },
        where: {
            id: String(tournamentId)
        }
    })
}

export async function getTournaments() {
    const tournamentNames = generateTournamentNames(13, 24);

    const tournamentIds = await prisma.tournament.findMany({
        where: {
            name: {
                in: tournamentNames
            }
        }
    });
    const tournaments = tournamentIds.map(tourament => tourament.id);
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
    async () => {
        return await prisma.tournament.findMany({
            where: {
                name: {
                    contains: "2025"
                }
            }
        });
    },
    null,
    { tags: ["tournaments"] }
);