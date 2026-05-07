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

export type DashboardSnapshot = {
    match1: any
    match2: any
    match3: any
    match4: any
    match5: any
    match6: any
    matchInfo1: any
    matchInfo2: any
    matchInfo3: any
    matchInfo4: any
    matchInfo5: any
    matchInfo6: any
    liveState1: MatchLiveState | null
    liveState2: MatchLiveState | null
    liveState3: MatchLiveState | null
    liveState4: MatchLiveState | null
    liveState5: MatchLiveState | null
    liveState6: MatchLiveState | null
    firstPlayer1: string | null
    firstPlayer2: string | null
    firstPlayer3: string | null
    firstPlayer4: string | null
    firstPlayer5: string | null
    firstPlayer6: string | null
    matchAvgA1: number | null
    matchAvgA2: number | null
    matchAvgA3: number | null
    matchAvgA4: number | null
    matchAvgA5: number | null
    matchAvgA6: number | null
    matchAvgB1: number | null
    matchAvgB2: number | null
    matchAvgB3: number | null
    matchAvgB4: number | null
    matchAvgB5: number | null
    matchAvgB6: number | null
}