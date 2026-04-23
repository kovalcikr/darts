import { createLocalRanking, createLocalResults, createLocalTournament } from '../../../../cuescore/mock-data'
import { CueScoreGateway, CueScoreRanking, CueScoreResults, CueScoreTournament, MatchScoreUpdate } from './types'

type FakeCueScoreStore = {
  tournaments: Map<string, CueScoreTournament>
  rankings: Map<string, CueScoreRanking>
  results: Map<string, CueScoreResults>
}

declare const globalThis: {
  fakeCueScoreStore?: FakeCueScoreStore
} & typeof global

function createStore(): FakeCueScoreStore {
  return {
    tournaments: new Map(),
    rankings: new Map(),
    results: new Map(),
  }
}

const store = globalThis.fakeCueScoreStore ?? createStore()

if (process.env.NODE_ENV !== 'production') {
  globalThis.fakeCueScoreStore = store
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function getOrCreateTournament(tournamentId: string): CueScoreTournament {
  const storedTournament = store.tournaments.get(tournamentId)
  if (storedTournament) {
    return storedTournament
  }

  const tournament = createLocalTournament(tournamentId)
  store.tournaments.set(tournamentId, tournament)
  return tournament
}

function updateStoredMatch(tournamentId: string, matchId: string, update: (match: any) => void) {
  const tournament = getOrCreateTournament(tournamentId)
  const match = tournament.matches.find((candidate) => String(candidate.matchId) === matchId)

  if (!match) {
    throw new Error(`Cannot find local match ${matchId}`)
  }

  update(match)
}

export class FakeCueScoreGateway implements CueScoreGateway {
  async getTournament(tournamentId: string): Promise<CueScoreTournament> {
    return clone(getOrCreateTournament(tournamentId))
  }

  async updateMatchScore({ tournamentId, matchId, scoreA, scoreB }: MatchScoreUpdate): Promise<void> {
    updateStoredMatch(tournamentId, matchId, (match) => {
      match.scoreA = scoreA
      match.scoreB = scoreB
      if (match.matchstatus === 'finished') {
        match.matchstatus = 'playing'
      }
    })
  }

  async finishMatch({ tournamentId, matchId, scoreA, scoreB }: MatchScoreUpdate): Promise<void> {
    updateStoredMatch(tournamentId, matchId, (match) => {
      match.scoreA = scoreA
      match.scoreB = scoreB
      match.matchstatus = 'finished'
    })
  }

  async getRanking(rankingId: string): Promise<CueScoreRanking> {
    const storedRanking = store.rankings.get(rankingId)
    if (storedRanking) {
      return clone(storedRanking)
    }

    return createLocalRanking(Array.from(store.tournaments.values()))
  }

  async getResults(tournamentId: string): Promise<CueScoreResults> {
    const storedResults = store.results.get(tournamentId)
    if (storedResults) {
      return clone(storedResults)
    }

    return createLocalResults(tournamentId)
  }
}
