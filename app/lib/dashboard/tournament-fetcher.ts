import type { CueScoreGateway, CueScoreMatch } from '@/app/lib/integrations/cuescore/types'
import { getCueScoreGateway } from '@/app/lib/integrations/cuescore'

export interface DashboardTournamentFetcher {
  getMatchInTable(tournamentId: string, tableId: string): Promise<CueScoreMatch | null>
}

export class CueScoreTournamentFetcher implements DashboardTournamentFetcher {
  constructor(private readonly gateway: CueScoreGateway) {}

  async getMatchInTable(tournamentId: string, tableId: string): Promise<CueScoreMatch | null> {
    const tournament = await this.gateway.getTournament(tournamentId)
    for (const match of tournament.matches) {
      if (match.matchstatus === 'playing' && match?.table?.name === tableId) {
        return { ...match, matchId: String(match.matchId) }
      }
    }
    return null
  }
}

export function createDefaultTournamentFetcher(): DashboardTournamentFetcher {
  return new CueScoreTournamentFetcher(getCueScoreGateway())
}