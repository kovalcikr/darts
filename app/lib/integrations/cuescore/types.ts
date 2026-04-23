export type CueScoreMatchStatus = 'scheduled' | 'playing' | 'finished'

export type CueScorePlayer = {
  playerId: string | number
  name: string
  image: string
}

export type CueScoreMatch = {
  matchId: string | number
  roundName: string
  round?: number
  playerA: CueScorePlayer
  playerB: CueScorePlayer
  raceTo: number
  tournamentId: string | number
  matchstatus: CueScoreMatchStatus
  table?: {
    name: string
  }
  scoreA?: number
  scoreB?: number
}

export type CueScoreTournament = {
  tournamentId: string | number
  name: string
  matches: CueScoreMatch[]
}

export type CueScoreRankingParticipant = {
  participantId: string | number
  rank: number
  name: string
}

export type CueScoreRanking = {
  participants: CueScoreRankingParticipant[]
}

export type CueScoreResults = {
  tournamentId?: string | number
  [key: number]: Array<{ name: string }>
}

export type MatchScoreUpdate = {
  tournamentId: string
  matchId: string
  scoreA: number
  scoreB: number
}

export interface CueScoreGateway {
  getTournament(tournamentId: string): Promise<CueScoreTournament>
  updateMatchScore(input: MatchScoreUpdate): Promise<void>
  finishMatch(input: MatchScoreUpdate): Promise<void>
  getRanking(rankingId: string): Promise<CueScoreRanking>
  getResults(tournamentId: string): Promise<CueScoreResults>
}

export type CueScoreProviderName = 'real' | 'fake'
