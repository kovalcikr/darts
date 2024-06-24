'use server'

import { revalidatePath } from "next/cache";
import prisma from "./db";
import { SourceTextModule } from "vm";
import { Tsukimi_Rounded, Uncial_Antiqua } from "next/font/google";
import { resetMatch } from "./match";

export async function addThrowAction(tournamentId, matchId, leg, playerId, score) {
    let closeLeg = false;
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
            }
        })
        if (closeLeg) {
            const match = await tx.match.findUnique({where: {id: matchId}});
            await tx.match.update({
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
        // TODO: close leg in cue score
    }
    
    revalidatePath('/tournaments/[id//tables/[table]');
}

export async function undoThrow(matchId, leg) {
    let undoCloseLeg = false;
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
                const match = await tx.match.findUnique({where: {id: matchId}});
                await tx.match.update({
                    data: {
                        playerALegs: match.playerALegs - (match.playerAId == previousLegLastThrow.playerId ? 1 : 0),
                        playerBlegs: match.playerBlegs - (match.playerBId == previousLegLastThrow.playerId ? 1 : 0)
                    },
                    where: {
                        id: matchId
                    }
                })
            } else {
                console.log("no prev prev")
                await tx.match.update({
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
    revalidatePath('/tournaments/[id//tables/[table]');
}
