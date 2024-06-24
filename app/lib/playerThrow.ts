'use server'

import { revalidatePath } from "next/cache";
import prisma from "./db";

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
