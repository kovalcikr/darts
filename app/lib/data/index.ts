// Data layer barrel exports
// Public API for lib/ and API route handlers

// Tournament queries
export { upsertTournament, findTournamentsByName, findTournamentsBySeason } from './tournament-queries'
export type { TournamentUpsertInput, FindTournamentsBySeasonOptions } from './tournament-queries'

// Queries
export { activeThrowWhere } from './queries'
export type { ScoreboardThrowHistoryItem } from './queries'
export { 
    findMatch, findThrowsByMatch, findThrowsByMatchAndLeg, 
    findHighestScoreInMatch, findBestCheckoutInMatch, findBestLegInMatch,
    findScoreboardThrowHistory, upsertMatch, updateMatchFirstPlayer,
    aggregatePlayerThrow, createPlayerThrow, invalidateRedoableThrows,
    updateMatchLegs, decrementMatchLegs, findLastThrow, markPlayerThrowUndone,
    findPreviousLegLastThrow, aggregateMatchThrows, findManyPlayerThrows,
    findRedoableThrow, restorePlayerThrow, findPlayersByTournament,
    findMatchesByTournament, deletePlayerThrow
} from './queries'

// Transaction utilities
export { runInTransaction } from './tx'

// Match operations
export { getSyncedMatchLegState, refreshMatchLiveState } from './match-operations'

// Re-export from match-live-state
export { findMatchLiveStates, refreshMatchLiveState as refreshMatchLiveStateFromRepo } from '../match-live-state'