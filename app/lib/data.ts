/**
 * This file contains all the functions that interact with the database.
 * This is done to make the application more testable, by allowing to mock the data access layer.
 */
import prisma from "./db";
import { Prisma } from '@prisma/client'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

const getPrismaClient = (tx?: PrismaTransactionClient) => tx || prisma;

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
            runTo: match.raceTo
        },
        update: {
            playerAId: String(match.playerA.playerId),
            playerAName: match.playerA.name,
            playerAImage: match.playerA.image,
            playerBId: String(match.playerB.playerId),
            playerBName: match.playerB.name,
            playerBImage: match.playerB.image,
            round: match.roundName,
            runTo: match.raceTo
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

export async function updateMatchLegs(matchId: string, playerAId: string, playerId: string, playerALegs: number, playerBlegs: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.update({
        data: {
            playerALegs: playerALegs + (playerAId == playerId ? 1 : 0),
            playerBlegs: playerBlegs + (playerAId == playerId ? 0 : 1)
        },
        where: {
            id: matchId
        }
    });
}

export async function decrementMatchLegs(matchId: string, playerAId: string, playerId: string, playerALegs: number, playerBlegs: number, tx?: PrismaTransactionClient) {
    const client = getPrismaClient(tx);
    return client.match.update({
        data: {
            playerALegs: playerALegs - (playerAId == playerId ? 1 : 0),
            playerBlegs: playerBlegs - (playerAId == playerId ? 0 : 1)
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
