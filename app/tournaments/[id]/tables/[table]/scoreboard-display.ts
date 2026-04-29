export type PlayerAccent = 'left' | 'right'

type PlayerAccentClasses = {
  playerCard: string
  throwActive: string
  throwUndone: string
}

export const PLAYER_ACCENT_CLASSES: Record<PlayerAccent, PlayerAccentClasses> = {
  left: {
    playerCard: 'border-l-4 border-emerald-400',
    throwActive: 'border-l-4 border-emerald-400 bg-emerald-500/10 text-emerald-100 ring-emerald-500/30',
    throwUndone: 'border-l-4 border-emerald-300 bg-rose-500/10 text-rose-100 line-through decoration-rose-200/80 ring-rose-500/30',
  },
  right: {
    playerCard: 'border-l-4 border-amber-400',
    throwActive: 'border-l-4 border-amber-400 bg-amber-500/10 text-amber-100 ring-amber-500/30',
    throwUndone: 'border-l-4 border-amber-300 bg-rose-500/10 text-rose-100 line-through decoration-rose-200/80 ring-rose-500/30',
  },
}

export function getPlayerCardAccentClassName(accent: PlayerAccent) {
  return PLAYER_ACCENT_CLASSES[accent].playerCard
}

export function getThrowHistoryAccentClassName(accent: PlayerAccent, undone: boolean) {
  return undone
    ? PLAYER_ACCENT_CLASSES[accent].throwUndone
    : PLAYER_ACCENT_CLASSES[accent].throwActive
}

export function buildScoreboardPlayerDisplayNames(playerNames: Record<string, string>) {
  const entries = Object.entries(playerNames)
  const firstNameCounts = new Map<string, number>()

  for (const [, name] of entries) {
    const firstName = getFirstName(name)
    firstNameCounts.set(firstName.toLocaleLowerCase(), (firstNameCounts.get(firstName.toLocaleLowerCase()) ?? 0) + 1)
  }

  return Object.fromEntries(
    entries.map(([playerId, name], index) => {
      const firstName = getFirstName(name)
      const hasDuplicateFirstName = (firstNameCounts.get(firstName.toLocaleLowerCase()) ?? 0) > 1

      return [
        playerId,
        hasDuplicateFirstName
          ? getDisambiguatedName(name, firstName, index)
          : firstName,
      ]
    }),
  )
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

function getDisambiguatedName(name: string, firstName: string, index: number) {
  const nameParts = name.trim().split(/\s+/)
  const lastInitial = nameParts.find((_, partIndex) => partIndex > 0)?.charAt(0).toLocaleUpperCase()

  if (lastInitial) {
    return `${firstName} ${lastInitial}.`
  }

  return `${firstName} ${index + 1}`
}
