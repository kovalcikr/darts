import { createLocalRanking, createLocalResults, createLocalTournament } from '../../../../cuescore/mock-data'
import { CueScoreGateway, CueScoreRanking, CueScoreResults, CueScoreTournament, MatchScoreUpdate } from './types'

export type FakeCueScoreEvent = {
  type: 'updateMatchScore' | 'finishMatch'
  tournamentId: string
  matchId: string
  scoreA: number
  scoreB: number
}

export type FakeCueScoreSnapshot = {
  tournament: CueScoreTournament | null
  events: FakeCueScoreEvent[]
}

type FakeCueScoreStore = {
  tournaments: Map<string, CueScoreTournament>
  rankings: Map<string, CueScoreRanking>
  results: Map<string, CueScoreResults>
  events: FakeCueScoreEvent[]
  delays: Map<string, number>
}

declare const globalThis: {
  fakeCueScoreStore?: FakeCueScoreStore
} & typeof global

function createStore(): FakeCueScoreStore {
  return {
    tournaments: new Map(),
    rankings: new Map(),
    results: new Map(),
    events: [],
    delays: new Map(),
  }
}

const store = globalThis.fakeCueScoreStore ?? createStore()

if (process.env.NODE_ENV !== 'production') {
  globalThis.fakeCueScoreStore = store
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function recordEvent(type: FakeCueScoreEvent['type'], input: MatchScoreUpdate) {
  store.events.push({
    type,
    tournamentId: input.tournamentId,
    matchId: input.matchId,
    scoreA: input.scoreA,
    scoreB: input.scoreB,
  })
}

async function applyDelay(method: string): Promise<void> {
  const ms = store.delays.get(method)
  if (ms) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
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

export function resetFakeCueScoreStore(tournamentId?: string) {
  if (!tournamentId) {
    store.tournaments.clear()
    store.rankings.clear()
    store.results.clear()
    store.events = []
    store.delays.clear()
    return
  }

  store.tournaments.delete(tournamentId)
  store.rankings.delete(tournamentId)
  store.results.delete(tournamentId)
  store.events = store.events.filter((event) => event.tournamentId !== tournamentId)
}

export function getFakeCueScoreSnapshot(tournamentId: string): FakeCueScoreSnapshot {
  return {
    tournament: clone(store.tournaments.get(tournamentId) ?? null),
    events: clone(store.events.filter((event) => event.tournamentId === tournamentId)),
  }
}

export function setFakeCueScoreDelay(method: string, ms: number): void {
  store.delays.set(method, ms)
}

export class FakeCueScoreGateway implements CueScoreGateway {
  async getTournament(tournamentId: string): Promise<CueScoreTournament> {
    await applyDelay('getTournament')
    return clone(getOrCreateTournament(tournamentId))
  }

  async updateMatchScore({ tournamentId, matchId, scoreA, scoreB }: MatchScoreUpdate): Promise<void> {
    await applyDelay('updateMatchScore')
    updateStoredMatch(tournamentId, matchId, (match) => {
      match.scoreA = scoreA
      match.scoreB = scoreB
      if (match.matchstatus === 'finished') {
        match.matchstatus = 'playing'
      }
    })
    recordEvent('updateMatchScore', { tournamentId, matchId, scoreA, scoreB })
  }

  async finishMatch({ tournamentId, matchId, scoreA, scoreB }: MatchScoreUpdate): Promise<void> {
    await applyDelay('finishMatch')
    updateStoredMatch(tournamentId, matchId, (match) => {
      match.scoreA = scoreA
      match.scoreB = scoreB
      match.matchstatus = 'finished'
    })
    recordEvent('finishMatch', { tournamentId, matchId, scoreA, scoreB })
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

  setDelayMs(method: string, ms: number): void {
    store.delays.set(method, ms)
  }
}
