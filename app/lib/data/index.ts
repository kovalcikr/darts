// Data layer barrel exports
// Public API for lib/ and API route handlers

// Tournament queries
export { upsertTournament, findTournamentsByName, findTournamentsBySeason } from './tournament-queries'
export type { TournamentUpsertInput, FindTournamentsBySeasonOptions } from './tournament-queries'

// Queries
export { activeThrowWhere } from './queries'
export type { ScoreboardThrowHistoryItem } from './queries'
export { 
    findMatch, findThrowsByMatch, findThrowsByMatchAndLeg, findActiveThrowsByMatchAndLeg,
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

// Match operations (re-exports canonical implementation)
export { getSyncedMatchLegState, refreshMatchLiveState } from './match-operations'

// Match live state repository
export { findMatchLiveStates, upsertMatchLiveState } from '../match-live-state/repository'
