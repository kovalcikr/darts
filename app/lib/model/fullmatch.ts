import type { PlayerThrow } from "@/prisma/client"

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

export type Player = {
    id: string,
    name: string
    imageUrl: string
    score: number
    dartsCount: number
    lastThrow: number
    matchAvg: number
    legCount: number
    active: boolean;
    highestScore: number;
    bestCheckout: number;
    bestLeg: number;
}
