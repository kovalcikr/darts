import { Match, Tournament } from "@prisma/client"

export type FullMatch = {
    match : Match
    tournament: Tournament
    currentLeg: number
    nextPlayer: string
    playerA: PlayerScore
    playerB: PlayerScore

}

export type PlayerScore = {
    score: number
    dartsCount: number
    lastThrow: number
    matchAvg: number
}