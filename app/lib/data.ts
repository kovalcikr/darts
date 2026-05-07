import 'server-only'

/**
 * This file contains all the functions that interact with the database.
 * This is done to make the application more testable, by allowing to mock the data access layer.
 */
import prisma from "./db";
import type { Prisma } from '@/prisma/client'
import { generateLegacyTournamentNamesForSeason } from "./tournament-metadata";
import { selectCurrentLegStarter } from "./leg-starter";
import { refreshMatchLiveState, findMatchLiveStates } from './match-live-state'

export { findMatchLiveStates }
export { refreshMatchLiveState }

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

const getPrismaClient = (tx?: PrismaTransactionClient) => tx || prisma;

export type ScoreboardThrowHistoryItem = {
    id: string
    playerId: string
    score: number
    darts: number
    checkout: boolean
    leg: number
    status: 'active' | 'undone'
    activityTime: Date
}

export type TournamentUpsertInput = {
    name: string
    season?: number | null
    eventDate?: Date | string | null
    includeInGlobalStats?: boolean
}

export type FindTournamentsBySeasonOptions = {
    includeExcluded?: boolean
}

export function isMatchComplete(runTo: number, playerALegs: number, playerBlegs: number) {
    return playerALegs >= runTo || playerBlegs >= runTo;
}

function getSyncedMatchLegState(match: {
    raceTo?: unknown
    runTo?: unknown
    scoreA?: unknown
    scoreB?: unknown
}) {
    const runTo = Number(match.raceTo ?? match.runTo);
    const playerALegs = Number(match.scoreA);
    const playerBlegs = Number(match.scoreB);

    if (!Number.isInteger(runTo) || !Number.isInteger(playerALegs) || !Number.isInteger(playerBlegs)) {
        return null;
    }

    return {
        playerALegs,
        playerBlegs,
        isComplete: isMatchComplete(runTo, playerALegs, playerBlegs),
    };
}

function activeThrowWhere(): Prisma.PlayerThrowWhereInput {
    return {
        undoneAt: null,
    };
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

export async function findHighestScoreInMatch(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const result = await client.playerThrow.aggregate({
        _max: {
            score: true,
        },
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            playerId: playerId,
        },
    });
    return result._max.score || 0;
}

export async function findBestCheckoutInMatch(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const result = await client.playerThrow.aggregate({
        _max: {
            score: true,
        },
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            playerId: playerId,
            checkout: true,
        },
    });
    return result._max.score || 0;
}

export async function findBestLegInMatch(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const wonLegs = await client.playerThrow.findMany({
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            playerId: playerId,
            checkout: true,
        },
        select: {
            leg: true,
        },
    });

    if (wonLegs.length === 0) {
        return 0;
    }
    const wonLegNumbers = wonLegs.map(l => l.leg);

    const result = await client.playerThrow.groupBy({
        by: ['leg'],
        _sum: {
            darts: true,
        },
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            playerId: playerId,
            leg: {
                in: wonLegNumbers,
            },
        },
        orderBy: {
            _sum: {
                darts: 'asc',
            },
        },
    });
    return result[0]?._sum.darts || 0;
}

export async function findThrowsByMatch(matchId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.findMany({
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
        },
        orderBy: {
            time: 'asc'
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

export async function findMatch(matchId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.findUnique({
        where: { id: matchId },
        include: { tournament: true }
    });
}

export async function upsertMatch(match, slot?: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const syncedMatchLegState = getSyncedMatchLegState(match);

    const persistedMatch = await client.match.upsert({
        create: {
            id: String(match.matchId),
            tournamentId: String(match.tournamentId),
            playerAId: String(match.playerA.playerId),
            playerAName: match.playerA.name,
            playerAImage: match.playerA.image,
            playerBId: String(match.playerB.playerId),
            playerBName: match.playerB.name,
            playerBImage: match.playerB.image,
            round: match.roundName,
            runTo: match.raceTo,
            ...(syncedMatchLegState ?? {})
        },
        update: {
            playerAId: String(match.playerA.playerId),
            playerAName: match.playerA.name,
            playerAImage: match.playerA.image,
            playerBId: String(match.playerB.playerId),
            playerBName: match.playerB.name,
            playerBImage: match.playerB.image,
            round: match.roundName,
            runTo: match.raceTo,
            ...(syncedMatchLegState ?? {})
        },
        where: {
            id: String(match.matchId)
        }
    });

    await refreshMatchLiveState(String(match.matchId), slot, tx);
    return persistedMatch;
}

export async function updateMatchFirstPlayer(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const match = await client.match.update({
        data: {
            firstPlayer: playerId
        }, where: {
            id: matchId
        }
    });

    await refreshMatchLiveState(matchId, undefined, tx);
    return match;
}

export async function findThrowsByMatchAndLeg(matchId: string, leg: number, playerA: string, playerB: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.groupBy({
        by: ['playerId'],
        _sum: {
            score: true,
            darts: true,
        },
        _count: {
            score: true
        },
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            leg: leg,
            playerId: {
                in: [playerA, playerB]
            }
        }
    });
}

export async function aggregatePlayerThrow(matchId: string, leg: number, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.aggregate({
        _sum: {
            score: true
        },
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            leg: leg,
            playerId: playerId
        }
    });
}

export async function createPlayerThrow(tournamentId: string, matchId: string, leg: number, playerId: string, score: number, dartsCount: number, checkout: boolean, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.create({
        data: {
            tournamentId: tournamentId,
            matchId: matchId,
            leg: leg,
            playerId: playerId,
            score: score,
            darts: dartsCount,
            checkout: checkout
        }
    });
}

export async function invalidateRedoableThrows(matchId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.updateMany({
        where: {
            matchId,
            undoneAt: {
                not: null,
            },
            redoInvalidatedAt: null,
        },
        data: {
            redoInvalidatedAt: new Date(),
        },
    });
}

export async function updateMatchLegs(matchId: string, playerAId: string, playerId: string, playerALegs: number, playerBlegs: number, runTo: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const nextPlayerALegs = playerALegs + (playerAId == playerId ? 1 : 0);
    const nextPlayerBlegs = playerBlegs + (playerAId == playerId ? 0 : 1);

    return client.match.update({
        data: {
            playerALegs: nextPlayerALegs,
            playerBlegs: nextPlayerBlegs,
            isComplete: isMatchComplete(runTo, nextPlayerALegs, nextPlayerBlegs)
        },
        where: {
            id: matchId
        }
    });
}

export async function decrementMatchLegs(matchId: string, playerAId: string, playerId: string, playerALegs: number, playerBlegs: number, runTo: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const nextPlayerALegs = playerALegs - (playerAId == playerId ? 1 : 0);
    const nextPlayerBlegs = playerBlegs - (playerAId == playerId ? 0 : 1);

    return client.match.update({
        data: {
            playerALegs: nextPlayerALegs,
            playerBlegs: nextPlayerBlegs,
            isComplete: isMatchComplete(runTo, nextPlayerALegs, nextPlayerBlegs)
        },
        where: {
            id: matchId
        }
    });
}

export async function findLastThrow(matchId: string, leg: number, playerId?: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.findFirst({
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            leg: leg,
            playerId: playerId
        },
        orderBy: {
            time: 'desc'
        }
    });
}

export async function markPlayerThrowUndone(id: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.update({
        where: {
            id,
        },
        data: {
            undoneAt: new Date(),
            redoInvalidatedAt: null,
        },
    });
}

export async function deletePlayerThrow(id: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.delete({
        where: {
            id: id
        }
    });
}

export async function findPreviousLegLastThrow(matchId: string, leg: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.findFirst({
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            leg: leg - 1,
        },
        orderBy: {
            time: 'desc'
        }
    });
}

export async function aggregateMatchThrows(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.aggregate({
        _sum: {
            score: true,
            darts: true,
        },
        where: {
            ...activeThrowWhere(),
            matchId: matchId,
            playerId: playerId
        },
    });
}

export async function findManyPlayerThrows(tournamentId: string, matchId: string, leg: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.findMany({
        where: {
            ...activeThrowWhere(),
            tournamentId: tournamentId,
            matchId: matchId,
            leg: leg
        },
        orderBy: {
            time: 'desc'
        },
        take: 6
    });
}

export async function findRedoableThrow(matchId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.findFirst({
        where: {
            matchId,
            undoneAt: {
                not: null,
            },
            redoInvalidatedAt: null,
        },
        orderBy: [
            {
                undoneAt: 'desc',
            },
            {
                time: 'desc',
            },
        ],
    });
}

export async function restorePlayerThrow(id: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.update({
        where: {
            id,
        },
        data: {
            undoneAt: null,
            redoInvalidatedAt: null,
        },
    });
}

export async function findScoreboardThrowHistory(matchId: string, limit = 6, tx?: PrismaTransactionClient): Promise<ScoreboardThrowHistoryItem[]> {
    const client = getPrismaClient(tx);
    const [activeThrows, undoneThrows] = await Promise.all([
        client.playerThrow.findMany({
            where: {
                ...activeThrowWhere(),
                matchId,
            },
            orderBy: [
                {
                    time: 'desc',
                },
            ],
            take: limit,
            select: {
                id: true,
                playerId: true,
                score: true,
                darts: true,
                checkout: true,
                leg: true,
                time: true,
            },
        }),
        client.playerThrow.findMany({
            where: {
                matchId,
                undoneAt: {
                    not: null,
                },
                redoInvalidatedAt: null,
            },
            orderBy: [
                {
                    undoneAt: 'desc',
                },
                {
                    time: 'desc',
                },
            ],
            take: limit,
            select: {
                id: true,
                playerId: true,
                score: true,
                darts: true,
                checkout: true,
                leg: true,
                undoneAt: true,
            },
        }),
    ]);

    return [
        ...activeThrows.map(playerThrow => ({
            id: playerThrow.id,
            playerId: playerThrow.playerId,
            score: playerThrow.score,
            darts: playerThrow.darts,
            checkout: playerThrow.checkout,
            leg: playerThrow.leg,
            status: 'active' as const,
            activityTime: playerThrow.time,
        })),
        ...undoneThrows.map(playerThrow => ({
            id: playerThrow.id,
            playerId: playerThrow.playerId,
            score: playerThrow.score,
            darts: playerThrow.darts,
            checkout: playerThrow.checkout,
            leg: playerThrow.leg,
            status: 'undone' as const,
            activityTime: playerThrow.undoneAt ?? new Date(0),
        })),
    ]
        .sort((a, b) => b.activityTime.getTime() - a.activityTime.getTime())
        .slice(0, limit);
}

export async function findPlayersByTournament(tournaments: string[], tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const playersA = await client.match.findMany({
        where: {
            tournamentId: {
                in: tournaments
            }
        },
        distinct: ["playerAId"],
        select: {
            playerAId: true,
            playerAName: true
        }
    });
    const playersB = await client.match.findMany({
        where: {
            tournamentId: {
                in: tournaments
            }
        },
        distinct: ["playerBId"],
        select: {
            playerBId: true,
            playerBName: true
        }
    });
    return { playersA, playersB };
}

export async function findMatchesByTournament(tournamentId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.findMany({
        where: {
            tournamentId: tournamentId
        }
    });
}
