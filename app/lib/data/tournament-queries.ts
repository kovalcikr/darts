import 'server-only'
import prisma, { type PrismaTransactionClient, getPrismaClient } from "@/app/lib/db";
import { generateLegacyTournamentNamesForSeason } from "../tournament-metadata";

export type TournamentUpsertInput = {
    name: string
    season?: number | null
    eventDate?: Date | string | null
    includeInGlobalStats?: boolean
}

export type FindTournamentsBySeasonOptions = {
    includeExcluded?: boolean
}

export async function upsertTournament(tournamentId: string, tournament: TournamentUpsertInput, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const eventDate =
        tournament.eventDate instanceof Date
            ? tournament.eventDate
            : tournament.eventDate
                ? new Date(tournament.eventDate)
                : null;

    return client.tournament.upsert({
        create: {
            id: String(tournamentId),
            name: tournament.name,
            season: tournament.season ?? null,
            eventDate,
            includeInGlobalStats: tournament.includeInGlobalStats ?? true,
        },
        update: {
            name: tournament.name,
            season: tournament.season ?? null,
            eventDate,
            ...(tournament.includeInGlobalStats === undefined
                ? {}
                : { includeInGlobalStats: tournament.includeInGlobalStats }),
        },
        where: {
            id: String(tournamentId)
        }
    });
}

export async function findTournamentsByName(tournamentNames: string[], tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.tournament.findMany({
        where: {
            name: {
                in: tournamentNames
            }
        }
    });
}

export async function findTournamentsBySeason(
    season: number,
    options: FindTournamentsBySeasonOptions = {},
    tx?: PrismaTransactionClient
) {
    const client = getPrismaClient(tx);
    const legacyNames = generateLegacyTournamentNamesForSeason(season);
    const includeExcluded = options.includeExcluded ?? false;

    return client.tournament.findMany({
        where: {
            AND: [
                includeExcluded ? {} : { includeInGlobalStats: true },
                {
                    OR: [
                        { season },
                        legacyNames.length > 0
                            ? {
                                season: null,
                                name: {
                                    in: legacyNames,
                                }
                            }
                            : {
                                season: null,
                                name: {
                                    contains: String(season)
                                }
                            }
                    ]
                }
            ]
        },
        orderBy: [
            {
                includeInGlobalStats: 'desc',
            },
            {
                eventDate: 'desc',
            },
            {
                name: 'asc',
            }
        ]
    });
}