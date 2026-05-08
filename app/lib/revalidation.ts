import { revalidatePath, revalidateTag } from "next/cache"

export function cacheTagForMatch(table: string): string {
  return `match${table}`
}

export function revalidateScoreboard(table: string) {
  revalidatePath('/tables/[table]', 'page')
  const cacheTag = cacheTagForMatch(table)
  revalidateTag(cacheTag, 'max')
}

export function revalidateSharedPaths() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/players')
  revalidatePath('/tournaments')
  revalidatePath('/stats/tournaments')
}

export function revalidateAdminPaths(matchIds: Array<string | null | undefined>, tournamentIds: Array<string | null | undefined>) {
  const uniqueMatchIds = Array.from(new Set(matchIds.filter((matchId): matchId is string => Boolean(matchId))))
  const uniqueTournamentIds = Array.from(
    new Set(tournamentIds.filter((tournamentId): tournamentId is string => Boolean(tournamentId)))
  )

  for (const tournamentId of uniqueTournamentIds) {
    revalidatePath(`/admin/tournaments/${tournamentId}`)
  }

  for (const matchId of uniqueMatchIds) {
    revalidatePath(`/admin/matches/${matchId}`)
  }
}

export function revalidateTournamentPaths(tournamentIds: Array<string | null | undefined>) {
  const uniqueTournamentIds = Array.from(
    new Set(tournamentIds.filter((tournamentId): tournamentId is string => Boolean(tournamentId)))
  )

  for (const tournamentId of uniqueTournamentIds) {
    revalidatePath(`/stats/tournaments/${tournamentId}`)
    revalidatePath(`/stats/tournaments/${tournamentId}/cache`)
  }
}

export function revalidateActiveTournamentPaths() {
  revalidatePath('/tables')
  revalidatePath('/dashboard')
  revalidatePath('/tables/[table]', 'page')
}

export function revalidateTournamentList() {
  revalidatePath("/stats/tournaments")
}
