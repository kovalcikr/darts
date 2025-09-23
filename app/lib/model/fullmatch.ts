import { Match, PlayerThrow, Tournament } from "@prisma/client"

export type FullMatch = {
    match: Match
    tournament: Tournament
    currentLeg: number
    nextPlayer: string
    playerA: Player
    playerB: Player
    throws: PlayerThrow[]
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
}