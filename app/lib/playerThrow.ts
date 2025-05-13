'use server'

import { revalidatePath, revalidateTag } from "next/cache";
import prisma from "./db";
import { setScore } from "./cuescore";

export async function addThrowAction(tournamentId, matchId, leg, playerId, score, dartsCount, slow, table) {
    if (slow) {
        await new Promise(resolve => setTimeout(resolve, 3000));  // TODO: remove
    }
    let closeLeg = false;
    let match = null;
    await prisma.$transaction(async (tx) => {
        const currentScore = await tx.playerThrow.aggregate({
            _sum: {
                score: true
            },
            where: {
                matchId: matchId,
                leg: leg,
                playerId: playerId
            }
        })
        if (currentScore._sum.score + score > 501) {
            throw new Error('Bust')
        }
        if (currentScore._sum.score + score == 501) {
            closeLeg = true;
        }
        await tx.playerThrow.create({
            data: {
                tournamentId: tournamentId,
                matchId: matchId,
                leg: leg,
                playerId: playerId,
                score: score,
                darts: dartsCount,
                checkout: (currentScore._sum.score + score == 501)
            }
        })
        if (closeLeg) {
            match = await tx.match.findUnique({ where: { id: matchId } });
            match = await tx.match.update({
                data: {
                    playerALegs: match.playerALegs + (match.playerAId == playerId ? 1 : 0),
                    playerBlegs: match.playerBlegs + (match.playerBId == playerId ? 1 : 0)
                },
                where: {
                    id: matchId
                }
            })
        }
    })
    if (closeLeg) {
        setScore(match.tournamentId, match.id, match.playerALegs, match.playerBlegs);
    }

    revalidatePath('/tournaments/[id]/tables/[table]', 'page');
    const cacheTag = `match${table}`
    console.log('revalidating tag', cacheTag)
    revalidateTag(cacheTag)
}

export async function undoThrow(matchId, leg, slow, table) {
    if (slow) {
        await new Promise(resolve => setTimeout(resolve, 3000));  // TODO: remove
    }
    let undoCloseLeg = false;
    let match = null;
    await prisma.$transaction(async (tx) => {
        const lastThrow = await tx.playerThrow.findFirst({
            where: {
                matchId: matchId,
                leg: leg,
            },
            orderBy: {
                time: 'desc'
            }
        })
        console.log(lastThrow);
        if (!lastThrow) {
            undoCloseLeg = true;
            const previousLegLastThrow = await tx.playerThrow.findFirst({
                where: {
                    matchId: matchId,
                    leg: leg - 1,
                },
                orderBy: {
                    time: 'desc'
                }
            })
            if (previousLegLastThrow) {
                await tx.playerThrow.delete({
                    where: {
                        id: previousLegLastThrow.id
                    }
                })
                match = await tx.match.findUnique({ where: { id: matchId } });
                match = await tx.match.update({
                    data: {
                        playerALegs: match.playerALegs - (match.playerAId == previousLegLastThrow.playerId ? 1 : 0),
                        playerBlegs: match.playerBlegs - (match.playerBId == previousLegLastThrow.playerId ? 1 : 0)
                    },
                    where: {
                        id: matchId
                    }
                })
            } else {
                undoCloseLeg = false;
                match = await tx.match.update({
                    data: {
                        firstPlayer: null
                    },
                    where: {
                        id: matchId
                    }
                })
            }
        } else {
            await tx.playerThrow.delete({
                where: {
                    id: lastThrow.id
                }
            })
        }
    });
    if (undoCloseLeg) {
        setScore(match.tournamentId, match.id, match.playerALegs, match.playerBlegs);
    }
    revalidatePath('/tournaments/[id]/tables/[table]', 'page');
    const cacheTag = `match${table}`
    console.log('revalidating tag', cacheTag)
    revalidateTag(cacheTag)

}

export async function findLastThrow(matchId, leg, player) {
    return await prisma.playerThrow.findFirst({
        where: {
            matchId: matchId,
            leg: leg,
            playerId: player
        },
        orderBy: {
            time: 'desc'
        }
    })
}

export async function findMatchAvg(matchId, player) {
    const data = await prisma.playerThrow.aggregate({
        _sum: {
            score: true,
            darts: true,
        },
        where: {
            matchId: matchId,
            playerId: player
        },
    });
    return data._sum.darts ? data._sum.score / data._sum.darts * 3 : 0;
}

export async function getPlayerThrowInfo(tournamentId, matchId, leg) {
    if (!matchId) {
        return null;
    }

    const score = await prisma.playerThrow.groupBy({
        by: ['tournamentId', 'matchId', 'leg', 'playerId'],
        _sum: {
            score: true
        },
        _count: {
            score: true
        },
        where: {
            tournamentId: tournamentId,
            matchId: matchId,
            leg: leg
        }
    });

    const lastThrows = await prisma.playerThrow.findMany({
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

    return { score, lastThrows };
}