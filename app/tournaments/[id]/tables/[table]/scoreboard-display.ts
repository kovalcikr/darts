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

export function buildScoreboardPlayerDisplayNames(
  playerNames: Record<string, string>,
  startingPlayerId: string,
) {
  const entries = Object.entries(playerNames)
  const firstNameCounts = new Map<string, number>()

  for (const [, name] of entries) {
    const firstName = getFirstName(name)
    firstNameCounts.set(firstName.toLocaleLowerCase(), (firstNameCounts.get(firstName.toLocaleLowerCase()) ?? 0) + 1)
  }

  const otherName = (playerId: string) => {
    const other = entries.find(([id]) => id !== playerId)
    return other ? other[1] : null
  }

  return Object.fromEntries(
    entries.map(([playerId, name]) => {
      const firstName = getFirstName(name)
      const hasDuplicateFirstName = (firstNameCounts.get(firstName.toLocaleLowerCase()) ?? 0) > 1

      return [
        playerId,
        hasDuplicateFirstName
          ? getDisambiguatedName(name, otherName(playerId)!, playerId === startingPlayerId)
          : firstName,
      ]
    }),
  )
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name
}

/**
 * Returns the last word of a full name (the surname),
 * or null if only a single name is given.
 */
function getSurname(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : null
}

/**
 * Produces a display name for scoreboard throw history when first names collide:
 * - Different surname initials → "First I."
 * - Same initial, different surnames → full surname (case-insensitive, diacritics matter)
 * - Same surname or no surname → "First 1" for starting player, "First 2" for the other
 */
function getDisambiguatedName(name: string, otherPlayerName: string, isStartingPlayer: boolean) {
  const firstName = getFirstName(name)
  const surname = getSurname(name)

  if (!surname) {
    return `${firstName} ${isStartingPlayer ? 1 : 2}`
  }

  const otherSurname = getSurname(otherPlayerName)
  const lastInitial = surname.charAt(0).toLocaleUpperCase()
  const otherInitial = otherSurname?.charAt(0).toLocaleUpperCase()

  if (lastInitial !== otherInitial) {
    return `${firstName} ${lastInitial}.`
  }

  if (otherSurname && surname.toLowerCase() !== otherSurname.toLowerCase()) {
    return surname
  }

  return `${firstName} ${isStartingPlayer ? 1 : 2}`
}
