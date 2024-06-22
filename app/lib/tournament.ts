'use server'

import { redirect } from "next/navigation";
import prisma from "./db";
import getTournamentInfo from "./cuescore";

export async function openTournamentForm(prevState: any, data : FormData) {
    const tournamentId = data.get('tournamentId') as string;
    try {
        await openTournament(tournamentId);
      } catch (e) {
        return { message: `Cannot open tournament: ${e.message}` }
      }
      redirect(`/tournaments/${tournamentId}`);
}

export async function openTournament(tournamentId : string) {
    const tournament = await getTournamentInfo(tournamentId);
    await createTournament(tournament);
}

export async function createTournament({tournamentId, name}) {
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