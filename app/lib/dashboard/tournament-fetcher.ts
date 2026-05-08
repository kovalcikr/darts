import type { CueScoreGateway, CueScoreMatch } from '@/app/lib/integrations/cuescore/types'
import { getCueScoreGateway } from '@/app/lib/integrations/cuescore'

export interface DashboardTournamentFetcher {
  getMatches(tournamentId: string): Promise<CueScoreMatch[]>
}

export class CueScoreTournamentFetcher implements DashboardTournamentFetcher {
  constructor(private readonly gateway: CueScoreGateway) {}

  async getMatches(tournamentId: string): Promise<CueScoreMatch[]> {
    const tournament = await this.gateway.getTournament(tournamentId)
    return tournament.matches
      .filter((match) => match.matchstatus === 'playing')
      .map((match) => ({ ...match, matchId: String(match.matchId) }))
  }
}

export function createDefaultTournamentFetcher(): DashboardTournamentFetcher {
  return new CueScoreTournamentFetcher(getCueScoreGateway())
}