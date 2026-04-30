import {
  CueScoreMatch,
  CueScorePlayer,
  CueScoreRanking,
  CueScoreResults,
  CueScoreTournament,
} from '../app/lib/integrations/cuescore/types'

const DEFAULT_PLAYER_IMAGE = '/favicon.ico'
const DEFAULT_TABLES = ['11', '12', '13', '14', '15', '16']
const DEFAULT_PLAYER_NAMES = [
  'Fero Hruska',
  'Jozo Mrkva',
  'Roman Cepel',
  'Marian Koleno',
  'Erik Laki',
  'Robert Stoynov',
  'Patrik Juhasz',
  'Martin Samek',
  'AlexandertheGreatestDartsPlayerWithAnExtremelyLongUnbrokenName',
  'Žofia Šampiónová Extra Long Tactical Checkout Specialist',
  'Peter Kovarik',
  'Peter Kovakir',
]

function createPlayer(tournamentId: string, index: number): CueScorePlayer {
  const name = DEFAULT_PLAYER_NAMES[index % DEFAULT_PLAYER_NAMES.length]
  return {
    playerId: `${tournamentId}-p${index + 1}`,
    name,
    image: DEFAULT_PLAYER_IMAGE,
  }
}

function createMatch(tournamentId: string, matchIndex: number, tableName: string): CueScoreMatch {
  const playerA = createPlayer(tournamentId, matchIndex * 2)
  const playerB = createPlayer(tournamentId, matchIndex * 2 + 1)

  return {
    matchId: `${tournamentId}-m${matchIndex + 1}`,
    roundName: 'Round 1',
    round: 1,
    playerA,
    playerB,
    raceTo: 3,
    tournamentId,
    matchstatus: 'playing',
    table: { name: tableName },
    scoreA: 0,
    scoreB: 0,
  }
}

export function createLocalTournament(tournamentId: string): CueScoreTournament {
  return {
    tournamentId,
    name: `Local Tournament ${tournamentId}`,
    matches: DEFAULT_TABLES.map((tableName, index) => createMatch(tournamentId, index, tableName)),
  }
}

export function createLocalRanking(tournaments: CueScoreTournament[]): CueScoreRanking {
  const participants = new Map<string, string>()

  tournaments.forEach((tournament) => {
    tournament.matches.forEach((match) => {
      participants.set(String(match.playerA.playerId), match.playerA.name)
      participants.set(String(match.playerB.playerId), match.playerB.name)
    })
  })

  if (participants.size === 0) {
    DEFAULT_PLAYER_NAMES.forEach((name, index) => {
      participants.set(`local-player-${index + 1}`, name)
    })
  }

  return {
    participants: Array.from(participants.entries())
      .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
      .map(([participantId, name], index) => ({
        participantId,
        rank: index + 1,
        name,
      })),
  }
}

export function createLocalResults(tournamentId: string): CueScoreResults {
  return {
    tournamentId,
  }
}
