import axios from 'axios'
import { CueScoreGateway, CueScoreRanking, CueScoreResults, CueScoreTournament, MatchScoreUpdate } from './types'

export class RealCueScoreGateway implements CueScoreGateway {
  async getTournament(tournamentId: string): Promise<CueScoreTournament> {
    const cookie = await auth()
    const tournament = await axios.get(`https://api.cuescore.com/tournament/?id=${tournamentId}`, {
      headers: {
        Cookie: cookie,
        cache: 'no-store',
      },
    })
    return tournament.data
  }

  async updateMatchScore({ tournamentId, matchId, scoreA, scoreB }: MatchScoreUpdate): Promise<void> {
    const cookie = await auth()
    const url = `https://cuescore.com/ajax/tournament/match.php?tournamentId=${tournamentId}&matchId=${matchId}&scoreA=${scoreA}&scoreB=${scoreB}&matchstatus=1`
    const res = await axios.get(url, {
      headers: {
        Cookie: cookie,
      },
    })

    if (res.data != 'OK') {
      throw new Error('Cannot update score')
    }
  }

  async finishMatch({ tournamentId, matchId, scoreA, scoreB }: MatchScoreUpdate): Promise<void> {
    const cookie = await auth()
    const url = `https://cuescore.com/ajax/tournament/match.php?tournamentId=${tournamentId}&matchId=${matchId}&scoreA=${scoreA}&scoreB=${scoreB}&matchstatus=2`
    const res = await axios.get(url, {
      headers: {
        Cookie: cookie,
      },
    })

    if (res.data != 'OK') {
      throw new Error('Cannot finish match')
    }
  }

  async getRanking(rankingId: string): Promise<CueScoreRanking> {
    const cookie = await auth()
    const url = `https://api.cuescore.com/ranking/?id=${rankingId}`
    const res = await axios.get(url, {
      headers: {
        Cookie: cookie,
      },
    })
    return res.data
  }

  async getResults(tournamentId: string): Promise<CueScoreResults> {
    const cookie = await auth()
    const url = `https://api.cuescore.com/tournament/?id=${tournamentId}&results=Result+list`
    const res = await axios.get(url, {
      headers: {
        Cookie: cookie,
      },
    })
    return res.data
  }
}

async function auth() {
  const res = await fetch('https://cuescore.com/ajax/user/login.php', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    body: new URLSearchParams({
      postUrl: '/ajax/user/login.php',
      domPath: '.User+.login+>+form',
      redirect: '',
      callback: '',
      hideOnOK: 'true',
      useSpinner: 'true',
      cover: '',
      username: process.env.CUESCORE_USERNAME as string,
      password: process.env.CUESCORE_PASSWORD as string,
      remember: 'on',
    }),
  })
  return res.headers.getSetCookie()
}
