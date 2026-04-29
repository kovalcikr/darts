import 'server-only'

import prisma from './db'

export const ACTIVE_TOURNAMENT_SETTING_KEY = 'activeTournamentId'

export async function getActiveTournamentId() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: ACTIVE_TOURNAMENT_SETTING_KEY },
    select: { value: true },
  })

  return setting?.value ?? null
}

export async function getActiveTournament() {
  const tournamentId = await getActiveTournamentId()

  if (!tournamentId) {
    return null
  }

  return prisma.tournament.findUnique({
    where: { id: tournamentId },
  })
}

export async function setActiveTournament(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  })

  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} was not found.`)
  }

  await prisma.appSetting.upsert({
    where: { key: ACTIVE_TOURNAMENT_SETTING_KEY },
    create: {
      key: ACTIVE_TOURNAMENT_SETTING_KEY,
      value: tournament.id,
    },
    update: {
      value: tournament.id,
    },
  })
}

export async function clearActiveTournament() {
  await prisma.appSetting.deleteMany({
    where: { key: ACTIVE_TOURNAMENT_SETTING_KEY },
  })
}

export async function clearActiveTournamentIfMatches(tournamentId: string) {
  await prisma.appSetting.deleteMany({
    where: {
      key: ACTIVE_TOURNAMENT_SETTING_KEY,
      value: tournamentId,
    },
  })
}
