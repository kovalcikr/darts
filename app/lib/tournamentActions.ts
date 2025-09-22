'use server'

import prisma from "./db";

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
