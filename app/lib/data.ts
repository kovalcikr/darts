import 'server-only'

/**
 * This file contains all the functions that interact with the database.
 * This is done to make the application more testable, by allowing to mock the data access layer.
 */
import prisma from "./db";
import type { Prisma } from '@/prisma/client'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

const getPrismaClient = (tx?: PrismaTransactionClient) => tx || prisma;

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

export async function upsertTournament(tournamentId: string, name: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.tournament.upsert({
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
    });
}

export async function findHighestScoreInMatch(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const result = await client.playerThrow.aggregate({
        _max: {
            score: true,
        },
        where: {
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

export async function findTournamentsByYear(year: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.tournament.findMany({
        where: {
            name: {
                contains: year
            }
        }
    });
}

export async function findMatch(matchId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.findUnique({
        where: { id: matchId },
        include: { tournament: true }
    });
}

export async function upsertMatch(match, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    const syncedMatchLegState = getSyncedMatchLegState(match);

    return client.match.upsert({
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
}

export async function updateMatchFirstPlayer(matchId: string, playerId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.update({
        data: {
            firstPlayer: playerId
        }, where: {
            id: matchId
        }
    });
}

export async function resetMatchData(matchId: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.update({
        data: {
            firstPlayer: null,
            playerALegs: 0,
            playerBlegs: 0,
            isComplete: false,
            throwsList: {
                deleteMany: {
                }
            }
        },
        where: {
            id: matchId
        }
    });
}

export async function findThrowsByMatchAndLeg(matchId: string, leg: number, playerA: string, playerB: string, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.groupBy({
        by: ['playerId'],
        _sum: {
            score: true
        },
        _count: {
            score: true
        },
        where: {
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
            matchId: matchId,
            leg: leg,
            playerId: playerId
        },
        orderBy: {
            time: 'desc'
        }
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
            matchId: matchId,
            playerId: playerId
        },
    });
}

export async function findManyPlayerThrows(tournamentId: string, matchId: string, leg: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.playerThrow.findMany({
        where: {
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
