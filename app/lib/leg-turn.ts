export type LegTurnContext = {
  currentLeg: number
  throwsByA: number
  throwsByB: number
  firstPlayer: string | null
  playerAId: string
  playerBId: string
}

export type LegStarterContext = {
  leg: number
  firstPlayer: string | null
  playerAId: string
  playerBId: string
}

export function getNextPlayer(ctx: LegTurnContext): string | null {
  const { currentLeg, throwsByA, throwsByB, firstPlayer, playerAId, playerBId } = ctx

  if (!firstPlayer) {
    return null
  }

  const throwCount = throwsByA + throwsByB
  const nextPlayer = (currentLeg + throwCount) % 2 === 1 ? firstPlayer : (firstPlayer === playerAId ? playerBId : playerAId)

  return nextPlayer
}

export function getLegStarter(ctx: LegStarterContext): string | null {
  const { leg, firstPlayer, playerAId, playerBId } = ctx

  if (!firstPlayer) {
    return null
  }

  return leg % 2 === 1 ? firstPlayer : (firstPlayer === playerAId ? playerBId : playerAId)
}