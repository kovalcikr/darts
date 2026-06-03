/**
 * Context for determining whose turn it is in a leg.
 */
export type LegTurnContext = {
  /** Current leg number (1-indexed). */
  currentLeg: number
  /** Number of throw records (not darts) by player A in the current leg. */
  throwsByA: number
  /** Number of throw records (not darts) by player B in the current leg. */
  throwsByB: number
  /** The player who threw first in the match, or null if not yet set. */
  firstPlayer: string | null
  /** Player A's ID. */
  playerAId: string
  /** Player B's ID. */
  playerBId: string
}

/**
 * Context for determining who starts a leg.
 */
export type LegStarterContext = {
  /** Leg number (1-indexed). */
  leg: number
  /** The player who threw first in the match, or null if not yet set. */
  firstPlayer: string | null
  /** Player A's ID. */
  playerAId: string
  /** Player B's ID. */
  playerBId: string
}

/**
 * Returns the player whose turn it is, or null if firstPlayer is not set.
 *
 * Turn order alternates by throw record (not by darts thrown). On odd
 * `(leg + totalThrows)` the first player throws; on even, the other player.
 */
export function getNextPlayer(ctx: LegTurnContext): string | null {
  const { currentLeg, throwsByA, throwsByB, firstPlayer, playerAId, playerBId } = ctx

  if (!firstPlayer) {
    return null
  }

  const throwCount = throwsByA + throwsByB
  const nextPlayer = (currentLeg + throwCount) % 2 === 1 ? firstPlayer : (firstPlayer === playerAId ? playerBId : playerAId)

  return nextPlayer
}

/**
 * Returns the player who starts the given leg, or null if firstPlayer is not set.
 *
 * The first player starts odd-numbered legs; the other player starts
 * even-numbered legs (alternate break).
 */
export function getLegStarter(ctx: LegStarterContext): string | null {
  const { leg, firstPlayer, playerAId, playerBId } = ctx

  if (!firstPlayer) {
    return null
  }

  return leg % 2 === 1 ? firstPlayer : (firstPlayer === playerAId ? playerBId : playerAId)
}
