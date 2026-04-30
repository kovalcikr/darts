import type { Match, PlayerThrow, Tournament } from "@/prisma/client"

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

export type FullMatch = {
    match: Match
    tournament: Tournament
    currentLeg: number
    nextPlayer: string
    startingPlayerId: string | null
    playerA: Player
    playerB: Player
    throws: PlayerThrow[]
    throwHistory: ScoreboardThrowHistoryItem[]
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
