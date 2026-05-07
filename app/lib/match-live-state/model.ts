export type MatchLiveState = {
    matchId: string
    tournamentId: string | null
    table: string | null
    leg: number
    playerAScoreLeft: number
    playerBScoreLeft: number
    playerATotalScore: number
    playerBTotalScore: number
    playerATotalDarts: number
    playerBTotalDarts: number
    activePlayerId: string | null
    startingPlayerId: string | null
    lastThrows: Array<{
        playerId: string
        score: number
        darts: number
        checkout: boolean
        leg: number
    }>
}