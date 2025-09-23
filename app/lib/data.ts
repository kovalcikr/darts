import prisma from "./db";

export async function upsertTournament(tournamentId: string, name: string) {
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
    });
}

export async function findTournamentsByName(tournamentNames: string[]) {
    return prisma.tournament.findMany({
        where: {
            name: {
                in: tournamentNames
            }
        }
    });
}

export async function findTournamentsByYear(year: string) {
    return prisma.tournament.findMany({
        where: {
            name: {
                contains: year
            }
        }
    });
}

export async function findMatch(matchId: string) {
    return prisma.match.findUnique({
        where: { id: matchId },
        include: { tournament: true }
    });
}

export async function upsertMatch(match) {
    return prisma.match.upsert({
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

export async function updateMatchFirstPlayer(matchId: string, playerId: string) {
    return prisma.match.update({
        data: {
            firstPlayer: playerId
        }, where: {
            id: matchId
        }
    });
}

export async function resetMatchData(matchId: string) {
    return prisma.match.update({
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

export async function findThrowsByMatchAndLeg(matchId: string, leg: number, playerA: string, playerB: string) {
    return prisma.playerThrow.groupBy({
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

export async function aggregatePlayerThrow(matchId: string, leg: number, playerId: string) {
    return prisma.playerThrow.aggregate({
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

export async function createPlayerThrow(tournamentId: string, matchId: string, leg: number, playerId: string, score: number, dartsCount: number, checkout: boolean) {
    return prisma.playerThrow.create({
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

export async function updateMatchLegs(matchId: string, playerAId: string, playerId: string, playerALegs: number, playerBlegs: number) {
    return prisma.match.update({
        data: {
            playerALegs: playerALegs + (playerAId == playerId ? 1 : 0),
            playerBlegs: playerBlegs + (playerAId == playerId ? 0 : 1)
        },
        where: {
            id: matchId
        }
    });
}

export async function decrementMatchLegs(matchId: string, playerAId: string, playerId: string, playerALegs: number, playerBlegs: number) {
    return prisma.match.update({
        data: {
            playerALegs: playerALegs - (playerAId == playerId ? 1 : 0),
            playerBlegs: playerBlegs - (playerAId == playerId ? 0 : 1)
        },
        where: {
            id: matchId
        }
    });
}

export async function findLastThrow(matchId: string, leg: number, playerId?: string) {
    return prisma.playerThrow.findFirst({
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

export async function deletePlayerThrow(id: string) {
    return prisma.playerThrow.delete({
        where: {
            id: id
        }
    });
}

export async function findPreviousLegLastThrow(matchId: string, leg: number) {
    return prisma.playerThrow.findFirst({
        where: {
            matchId: matchId,
            leg: leg - 1,
        },
        orderBy: {
            time: 'desc'
        }
    });
}

export async function aggregateMatchThrows(matchId: string, playerId: string) {
    return prisma.playerThrow.aggregate({
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

export async function findManyPlayerThrows(tournamentId: string, matchId: string, leg: number) {
    return prisma.playerThrow.findMany({
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

export async function findPlayersByTournament(tournaments: string[]) {
    const playersA = await prisma.match.findMany({
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
    const playersB = await prisma.match.findMany({
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
