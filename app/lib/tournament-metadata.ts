const LEGACY_2024_START = 13
const LEGACY_2024_END = 24

export type TournamentMetadata = {
  name: string
  season: number | null
  eventDate: Date | null
}

export function generateLegacyTournamentNamesForSeason(season: number) {
  if (season !== 2024) {
    return []
  }

  const names: string[] = []
  for (let i = LEGACY_2024_START; i <= LEGACY_2024_END; i++) {
    names.push(`Relax Darts CUP ${i} 2024`)
  }

  return names
}

export function parseTournamentDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

export function parseTournamentSeason(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }

  if (typeof value === 'string' && /^\d{4}$/.test(value)) {
    return Number(value)
  }

  return null
}

export function inferTournamentSeasonFromName(name: string | null | undefined) {
  if (!name) {
    return null
  }

  if (generateLegacyTournamentNamesForSeason(2024).includes(name)) {
    return 2024
  }

  const match = name.match(/\b(20\d{2})\b/)
  return match ? Number(match[1]) : null
}

export function inferTournamentSeason({
  explicitSeason,
  eventDate,
  name,
}: {
  explicitSeason?: unknown
  eventDate?: Date | null
  name?: string | null
}) {
  const parsedSeason = parseTournamentSeason(explicitSeason)
  if (parsedSeason !== null) {
    return parsedSeason
  }

  if (eventDate) {
    return eventDate.getFullYear()
  }

  return inferTournamentSeasonFromName(name)
}

export function formatTournamentEventDate(date: Date | string | null | undefined) {
  const parsedDate = parseTournamentDate(date)
  if (!parsedDate) {
    return null
  }

  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}
