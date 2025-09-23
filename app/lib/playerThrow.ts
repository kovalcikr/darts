'use server'

import { revalidatePath, revalidateTag } from "next/cache";
import { setScore } from "./cuescore";
import { aggregatePlayerThrow, createPlayerThrow, updateMatchLegs, findLastThrow as findLastThrowData, deletePlayerThrow, findPreviousLegLastThrow, aggregateMatchThrows, findManyPlayerThrows, findThrowsByMatchAndLeg, updateMatchFirstPlayer, decrementMatchLegs } from "./data";
import { findMatch } from "./data";
import prisma from "./db";

export async function addThrowAction(tournamentId, matchId, leg, playerId, score, dartsCount, slow, table) {
    if (slow) {
        await new Promise(resolve => setTimeout(resolve, 3000));  // TODO: remove
    }
    let closeLeg = false;
    let match = null;
    await prisma.$transaction(async (tx) => {
        const currentScore = await aggregatePlayerThrow(matchId, leg, playerId, tx);
        if (currentScore._sum.score + score > 501) {
            throw new Error('Bust')
        }
        if (currentScore._sum.score + score == 501) {
            closeLeg = true;
        }
        await createPlayerThrow(tournamentId, matchId, leg, playerId, score, dartsCount, closeLeg, tx);
        if (closeLeg) {
            match = await findMatch(matchId, tx);
            match = await updateMatchLegs(matchId, match.playerAId, playerId, match.playerALegs, match.playerBlegs, tx);
        }
    });
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
        const lastThrow = await findLastThrowData(matchId, leg, undefined, tx);
        console.log(lastThrow);
        if (!lastThrow) {
            undoCloseLeg = true;
            const previousLegLastThrow = await findPreviousLegLastThrow(matchId, leg, tx);
            if (previousLegLastThrow) {
                await deletePlayerThrow(previousLegLastThrow.id, tx)
                match = await findMatch(matchId, tx);
                match = await decrementMatchLegs(matchId, match.playerAId, previousLegLastThrow.playerId, match.playerALegs, match.playerBlegs, tx);
            } else {
                undoCloseLeg = false;
                await updateMatchFirstPlayer(matchId, null, tx);
            }
        } else {
            await deletePlayerThrow(lastThrow.id, tx)
        }
    });
    if (undoCloseLeg && match) {
        setScore(match.tournamentId, match.id, match.playerALegs, match.playerBlegs);
    }
    revalidatePath('/tournaments/[id]/tables/[table]', 'page');
    const cacheTag = `match${table}`
    console.log('revalidating tag', cacheTag)
    revalidateTag(cacheTag)

}

export async function findLastThrow(matchId, leg, player) {
    return await findLastThrowData(matchId, leg, player);
}

export async function findMatchAvg(matchId, player) {
    const data = await aggregateMatchThrows(matchId, player);
    if (!data._sum.darts) {
        return 0;
    }
    return data._sum.score / data._sum.darts * 3;
}

export async function getPlayerThrowInfo(tournamentId, matchId, leg, playerA, playerB) {
    if (!matchId) {
        return null;
    }

    const score = await findThrowsByMatchAndLeg(matchId, leg, playerA, playerB);

    const lastThrows = await findManyPlayerThrows(tournamentId, matchId, leg);

    return { score, lastThrows };
}