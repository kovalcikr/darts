'use server'

import type { Prisma } from '@/prisma/client'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  clearActiveTournament,
  clearActiveTournamentIfMatches,
  setActiveTournament,
} from '@/app/lib/active-tournament'
import prisma from '@/app/lib/db'
import { isMatchComplete } from '@/app/lib/utils/match'
import { openActiveTournament } from '@/app/lib/tournament'
import {
  ADMIN_PASSWORD_ENV,
  ADMIN_SESSION_COOKIE,
  ADMIN_USERNAME_ENV,
  getAdminSessionToken,
  isAdminAuthenticated,
  isAdminConfigured,
  validateAdminCredentials,
} from './auth'

function getReturnTo(formData: FormData) {
  const rawValue = String(formData.get('returnTo') ?? '/admin')
  return rawValue.startsWith('/admin') ? rawValue : '/admin'
}

function getRedirectTarget(returnTo: string, key: 'notice' | 'error', value: string) {
  const url = new URL(returnTo, 'http://localhost')
  url.searchParams.delete('notice')
  url.searchParams.delete('error')
  url.searchParams.set(key, value)
  const search = url.searchParams.toString()
  return `${url.pathname}${search ? `?${search}` : ''}`
}

function redirectWithNotice(returnTo: string, notice: string) {
  redirect(getRedirectTarget(returnTo, 'notice', notice))
}

function redirectWithError(returnTo: string, error: string) {
  redirect(getRedirectTarget(returnTo, 'error', error))
}

async function requireAdminSession(returnTo: string) {
  if (!(await isAdminAuthenticated())) {
    redirectWithError(returnTo, 'Please log in again.')
  }
}

function requireString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()

  if (!value) {
    throw new Error(`${key} is required.`)
  }

  return value
}

function requireDeleteBatchId(value: string | null | undefined, entity: string, id: string) {
  if (!value) {
    throw new Error(`${entity} audit ${id} cannot be safely restored because it has no delete batch.`)
  }

  return value
}

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()
  return value ? value : null
}

function requireInteger(formData: FormData, key: string) {
  const rawValue = requireString(formData, key)
  const value = Number(rawValue)

  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer.`)
  }

  return value
}

function optionalInteger(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? '').trim()

  if (!rawValue) {
    return null
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer.`)
  }

  return value
}

function optionalDate(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? '').trim()

  if (!rawValue) {
    return null
  }

  const value = new Date(rawValue)

  if (Number.isNaN(value.valueOf())) {
    throw new Error(`${key} must be a valid date.`)
  }

  return value
}

function requireDate(formData: FormData, key: string) {
  const rawValue = requireString(formData, key)
  const value = new Date(rawValue)

  if (Number.isNaN(value.valueOf())) {
    throw new Error(`${key} must be a valid date.`)
  }

  return value
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unexpected admin action error.'
}

function revalidateSharedPaths() {
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/players')
  revalidatePath('/tournaments')
  revalidatePath('/stats/tournaments')
}

function revalidateAdminPaths(matchIds: Array<string | null | undefined>, tournamentIds: Array<string | null | undefined>) {
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

function revalidateTournamentPaths(tournamentIds: Array<string | null | undefined>) {
  const uniqueTournamentIds = Array.from(
    new Set(tournamentIds.filter((tournamentId): tournamentId is string => Boolean(tournamentId)))
  )

  for (const tournamentId of uniqueTournamentIds) {
    revalidatePath(`/stats/tournaments/${tournamentId}`)
    revalidatePath(`/stats/tournaments/${tournamentId}/cache`)
  }
}

function revalidateActiveTournamentPaths() {
  revalidatePath('/tables')
  revalidatePath('/dashboard')
  revalidatePath('/tables/[table]', 'page')
}

const THROW_TIME_STEP_MS = 1_000

type OrderedThrow = {
  id: string
  time: Date
}

function findInsertionIndex(
  throws: OrderedThrow[],
  insertBeforeId: string | null,
  insertAfterId: string | null
) {
  if (insertBeforeId) {
    const index = throws.findIndex((playerThrow) => playerThrow.id === insertBeforeId)

    if (index === -1) {
      throw new Error(`Throw ${insertBeforeId} was not found for insertion.`)
    }

    return index
  }

  if (insertAfterId) {
    const index = throws.findIndex((playerThrow) => playerThrow.id === insertAfterId)

    if (index === -1) {
      throw new Error(`Throw ${insertAfterId} was not found for insertion.`)
    }

    return index + 1
  }

  return throws.length
}

async function resequenceLegThrowTimes(
  tx: Prisma.TransactionClient,
  throws: OrderedThrow[]
) {
  if (throws.length === 0) {
    return []
  }

  const start = throws[0].time.getTime()
  const resequencedThrows: OrderedThrow[] = []

  for (const [index, playerThrow] of throws.entries()) {
    const nextTime = new Date(start + index * THROW_TIME_STEP_MS)

    if (playerThrow.time.getTime() !== nextTime.getTime()) {
      await tx.playerThrow.update({
        where: { id: playerThrow.id },
        data: { time: nextTime },
      })
    }

    resequencedThrows.push({
      ...playerThrow,
      time: nextTime,
    })
  }

  return resequencedThrows
}

function getInsertedThrowTime(throws: OrderedThrow[], insertionIndex: number) {
  if (throws.length === 0) {
    return new Date()
  }

  if (insertionIndex === 0) {
    return new Date(throws[0].time.getTime() - THROW_TIME_STEP_MS)
  }

  if (insertionIndex >= throws.length) {
    return new Date(throws[throws.length - 1].time.getTime() + THROW_TIME_STEP_MS)
  }

  const previousTime = throws[insertionIndex - 1].time.getTime()
  const nextTime = throws[insertionIndex].time.getTime()

  if (nextTime - previousTime <= 1) {
    return null
  }

  return new Date(previousTime + Math.floor((nextTime - previousTime) / 2))
}

export async function loginAdminAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  const username = requireString(formData, 'username')
  const password = requireString(formData, 'password')

  if (!isAdminConfigured()) {
    redirectWithError(
      returnTo,
      `Set ${ADMIN_USERNAME_ENV} and ${ADMIN_PASSWORD_ENV} before using /admin.`
    )
  }

  if (!validateAdminCredentials(username, password)) {
    redirectWithError(returnTo, 'Invalid admin username or password.')
  }

  const sessionToken = getAdminSessionToken()

  if (!sessionToken) {
    redirectWithError(
      returnTo,
      `Set ${ADMIN_USERNAME_ENV} and ${ADMIN_PASSWORD_ENV} before using /admin.`
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  redirectWithNotice(returnTo, 'Logged in.')
}

export async function logoutAdminAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  redirectWithNotice(returnTo, 'Logged out.')
}

export async function createActiveTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const tournamentId = requireString(formData, 'tournamentId')

    await openActiveTournament(tournamentId)

    revalidateSharedPaths()
    revalidateAdminPaths([], [tournamentId])
    revalidateTournamentPaths([tournamentId])
    revalidateActiveTournamentPaths()
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Tournament created and set active.')
}

export async function setActiveTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const tournamentId = requireString(formData, 'tournamentId')

    await setActiveTournament(tournamentId)

    revalidateSharedPaths()
    revalidateAdminPaths([], [tournamentId])
    revalidateTournamentPaths([tournamentId])
    revalidateActiveTournamentPaths()
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Active tournament updated.')
}

export async function clearActiveTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    await clearActiveTournament()

    revalidateSharedPaths()
    revalidateActiveTournamentPaths()
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Active tournament cleared.')
}

export async function updateTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const name = requireString(formData, 'name')
    const season = optionalInteger(formData, 'season')
    const eventDate = optionalDate(formData, 'eventDate')
    const includeInGlobalStats = getBoolean(formData, 'includeInGlobalStats')

    await prisma.tournament.update({
      where: { id },
      data: {
        name,
        season,
        eventDate,
        includeInGlobalStats,
      },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([], [id])
    revalidateTournamentPaths([id])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Tournament updated.')
}

export async function toggleTournamentGlobalStatsAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const includeInGlobalStats = getBoolean(formData, 'includeInGlobalStats')

    await prisma.tournament.update({
      where: { id },
      data: {
        includeInGlobalStats,
      },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([], [id])
    revalidateTournamentPaths([id])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(
    returnTo,
    getBoolean(formData, 'includeInGlobalStats')
      ? 'Tournament included in global stats.'
      : 'Tournament excluded from global stats.'
  )
}

export async function deleteTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const deleteBatchId = randomUUID()

    await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id },
        include: {
          matches: {
            include: {
              throwsList: true,
            },
          },
        },
      })

      if (!tournament) {
        throw new Error(`Tournament ${id} was not found.`)
      }

      await tx.tournamentAudit.create({
        data: {
          tournamentId: tournament.id,
          name: tournament.name,
          season: tournament.season,
          eventDate: tournament.eventDate,
          includeInGlobalStats: tournament.includeInGlobalStats,
          deleteBatchId,
          deletedBy: 'admin',
        },
      })

      for (const match of tournament.matches) {
        await tx.matchAudit.create({
          data: {
            matchId: match.id,
            tournamentId: match.tournamentId,
            round: match.round,
            playerAId: match.playerAId,
            playerAName: match.playerAName,
            playerAImage: match.playerAImage,
            playerBId: match.playerBId,
            playerBName: match.playerBName,
            playerBImage: match.playerBImage,
            runTo: match.runTo,
            playerALegs: match.playerALegs,
            playerBlegs: match.playerBlegs,
            isComplete: match.isComplete,
            firstPlayer: match.firstPlayer,
            deleteBatchId,
            deletedBy: 'admin',
          },
        })

        for (const playerThrow of match.throwsList) {
          await tx.throwAudit.create({
            data: {
              throwId: playerThrow.id,
              tournamentId: playerThrow.tournamentId,
              matchId: playerThrow.matchId,
              leg: playerThrow.leg,
              playerId: playerThrow.playerId,
              time: playerThrow.time,
              score: playerThrow.score,
              darts: playerThrow.darts,
              doubles: playerThrow.doubles,
              checkout: playerThrow.checkout,
              undoneAt: playerThrow.undoneAt,
              redoInvalidatedAt: playerThrow.redoInvalidatedAt,
              deleteBatchId,
              deletedBy: 'admin',
            },
          })
        }
      }

      await tx.playerThrow.deleteMany({
        where: { tournamentId: id },
      })
      await tx.match.deleteMany({
        where: { tournamentId: id },
      })
      await tx.tournament.delete({
        where: { id },
      })
    })
    await clearActiveTournamentIfMatches(id)

    revalidateSharedPaths()
    revalidateAdminPaths([], [id])
    revalidateTournamentPaths([id])
    revalidateActiveTournamentPaths()
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Tournament deleted.')
}

export async function updateMatchAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const previousMatch = await prisma.match.findUnique({
      where: { id },
      select: { tournamentId: true },
    })

    if (!previousMatch) {
      throw new Error(`Match ${id} was not found.`)
    }

    const runTo = requireInteger(formData, 'runTo')
    const playerALegs = requireInteger(formData, 'playerALegs')
    const playerBlegs = requireInteger(formData, 'playerBlegs')

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        tournamentId: optionalString(formData, 'tournamentId'),
        round: requireString(formData, 'round'),
        playerAId: requireString(formData, 'playerAId'),
        playerAName: requireString(formData, 'playerAName'),
        playerAImage: requireString(formData, 'playerAImage'),
        playerBId: requireString(formData, 'playerBId'),
        playerBName: requireString(formData, 'playerBName'),
        playerBImage: requireString(formData, 'playerBImage'),
        runTo,
        playerALegs,
        playerBlegs,
        isComplete: isMatchComplete(runTo, playerALegs, playerBlegs),
        firstPlayer: optionalString(formData, 'firstPlayer'),
      },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([id], [previousMatch.tournamentId, updatedMatch.tournamentId])
    revalidateTournamentPaths([previousMatch.tournamentId, updatedMatch.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Match updated.')
}

export async function deleteMatchAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)
  let tournamentId: string | null | undefined

  try {
    const id = requireString(formData, 'id')
    const deleteBatchId = randomUUID()

    await prisma.$transaction(async (tx) => {
      const existingMatch = await tx.match.findUnique({
        where: { id },
        include: {
          throwsList: true,
        },
      })

      if (!existingMatch) {
        throw new Error(`Match ${id} was not found.`)
      }

      tournamentId = existingMatch.tournamentId

      await tx.matchAudit.create({
        data: {
          matchId: existingMatch.id,
          tournamentId: existingMatch.tournamentId,
          round: existingMatch.round,
          playerAId: existingMatch.playerAId,
          playerAName: existingMatch.playerAName,
          playerAImage: existingMatch.playerAImage,
          playerBId: existingMatch.playerBId,
          playerBName: existingMatch.playerBName,
          playerBImage: existingMatch.playerBImage,
          runTo: existingMatch.runTo,
          playerALegs: existingMatch.playerALegs,
          playerBlegs: existingMatch.playerBlegs,
          isComplete: existingMatch.isComplete,
          firstPlayer: existingMatch.firstPlayer,
          deleteBatchId,
          deletedBy: 'admin',
        },
      })

      for (const playerThrow of existingMatch.throwsList) {
        await tx.throwAudit.create({
          data: {
            throwId: playerThrow.id,
            tournamentId: playerThrow.tournamentId,
            matchId: playerThrow.matchId,
            leg: playerThrow.leg,
            playerId: playerThrow.playerId,
            time: playerThrow.time,
            score: playerThrow.score,
            darts: playerThrow.darts,
            doubles: playerThrow.doubles,
            checkout: playerThrow.checkout,
            undoneAt: playerThrow.undoneAt,
            redoInvalidatedAt: playerThrow.redoInvalidatedAt,
            deleteBatchId,
            deletedBy: 'admin',
          },
        })
      }

      await tx.match.delete({
        where: { id },
      })
    })

    revalidateSharedPaths()
    revalidateAdminPaths([id], [tournamentId])
    revalidateTournamentPaths([tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Match deleted.')
}

export async function createThrowAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const tournamentId = requireString(formData, 'tournamentId')
    const matchId = requireString(formData, 'matchId')
    const leg = requireInteger(formData, 'leg')
    const playerId = requireString(formData, 'playerId')
    const score = requireInteger(formData, 'score')
    const darts = requireInteger(formData, 'darts')
    const doubles = optionalInteger(formData, 'doubles')
    const checkout = getBoolean(formData, 'checkout')
    const insertBeforeId = optionalString(formData, 'insertBeforeId')
    const insertAfterId = optionalString(formData, 'insertAfterId')

    await prisma.$transaction(async (tx) => {
      const existingThrows = await tx.playerThrow.findMany({
        where: {
          matchId,
          leg,
          undoneAt: null,
        },
        select: {
          id: true,
          time: true,
        },
        orderBy: [{ time: 'asc' }, { id: 'asc' }],
      })

      const insertionIndex = findInsertionIndex(existingThrows, insertBeforeId, insertAfterId)
      let insertedTime = getInsertedThrowTime(existingThrows, insertionIndex)

      if (!insertedTime) {
        const resequencedThrows = await resequenceLegThrowTimes(tx, existingThrows)
        insertedTime = getInsertedThrowTime(resequencedThrows, insertionIndex)
      }

      if (!insertedTime) {
        throw new Error('Could not determine insertion position for the new throw.')
      }

      await tx.playerThrow.create({
        data: {
          tournamentId,
          matchId,
          leg,
          playerId,
          time: insertedTime,
          score,
          darts,
          doubles,
          checkout,
        },
      })
    })

    revalidateSharedPaths()
    revalidateAdminPaths([matchId], [tournamentId])
    revalidateTournamentPaths([tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Throw inserted.')
}

export async function updateThrowAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const id = requireString(formData, 'id')
    const previousThrow = await prisma.playerThrow.findUnique({
      where: { id },
      select: { tournamentId: true },
    })

    if (!previousThrow) {
      throw new Error(`Throw ${id} was not found.`)
    }

    const updatedThrow = await prisma.playerThrow.update({
      where: { id },
      data: {
        tournamentId: requireString(formData, 'tournamentId'),
        matchId: requireString(formData, 'matchId'),
        leg: requireInteger(formData, 'leg'),
        playerId: requireString(formData, 'playerId'),
        time: requireDate(formData, 'time'),
        score: requireInteger(formData, 'score'),
        darts: requireInteger(formData, 'darts'),
        doubles: optionalInteger(formData, 'doubles'),
        checkout: getBoolean(formData, 'checkout'),
      },
    })

    revalidateSharedPaths()
    revalidateAdminPaths([updatedThrow.matchId], [previousThrow.tournamentId, updatedThrow.tournamentId])
    revalidateTournamentPaths([previousThrow.tournamentId, updatedThrow.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Throw updated.')
}

export async function deleteThrowAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)
  let existingThrow: {
    tournamentId: string
    matchId: string
  } | null = null

  try {
    const id = requireString(formData, 'id')
    const deleteBatchId = randomUUID()

    await prisma.$transaction(async (tx) => {
      const playerThrow = await tx.playerThrow.findUnique({
        where: { id },
      })

      if (!playerThrow) {
        throw new Error(`Throw ${id} was not found.`)
      }

      existingThrow = {
        tournamentId: playerThrow.tournamentId,
        matchId: playerThrow.matchId,
      }

      await tx.throwAudit.create({
        data: {
          throwId: playerThrow.id,
          tournamentId: playerThrow.tournamentId,
          matchId: playerThrow.matchId,
          leg: playerThrow.leg,
          playerId: playerThrow.playerId,
          time: playerThrow.time,
          score: playerThrow.score,
          darts: playerThrow.darts,
          doubles: playerThrow.doubles,
          checkout: playerThrow.checkout,
          undoneAt: playerThrow.undoneAt,
          redoInvalidatedAt: playerThrow.redoInvalidatedAt,
          deleteBatchId,
          deletedBy: 'admin',
        },
      })

      await tx.playerThrow.delete({
        where: { id },
      })
    })

    revalidateSharedPaths()
    revalidateAdminPaths([existingThrow?.matchId], [existingThrow?.tournamentId])
    revalidateTournamentPaths([existingThrow?.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Throw deleted.')
}

export async function restoreTournamentAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const tournamentId = requireString(formData, 'tournamentId')
    const tournament = await prisma.$transaction(async (tx) => {
      const tournamentAudit = await tx.tournamentAudit.findFirst({
        where: { tournamentId },
        orderBy: { deletedAt: 'desc' },
      })

      if (!tournamentAudit) {
        throw new Error(`Tournament audit ${tournamentId} was not found.`)
      }

      const deleteBatchId = requireDeleteBatchId(tournamentAudit.deleteBatchId, 'Tournament', tournamentId)

      const restoredTournament = await tx.tournament.create({
        data: {
          id: tournamentAudit.tournamentId,
          name: tournamentAudit.name,
          season: tournamentAudit.season,
          eventDate: tournamentAudit.eventDate,
          includeInGlobalStats: tournamentAudit.includeInGlobalStats,
        },
      })

      const matchAudits = await tx.matchAudit.findMany({
        where: { deleteBatchId, tournamentId },
      })

      for (const matchAudit of matchAudits) {
        await tx.match.create({
          data: {
            id: matchAudit.matchId,
            tournamentId: matchAudit.tournamentId,
            round: matchAudit.round,
            playerAId: matchAudit.playerAId,
            playerAName: matchAudit.playerAName,
            playerAImage: matchAudit.playerAImage,
            playerBId: matchAudit.playerBId,
            playerBName: matchAudit.playerBName,
            playerBImage: matchAudit.playerBImage,
            runTo: matchAudit.runTo,
            playerALegs: matchAudit.playerALegs,
            playerBlegs: matchAudit.playerBlegs,
            isComplete: matchAudit.isComplete,
            firstPlayer: matchAudit.firstPlayer,
          },
        })

        const throwAudits = await tx.throwAudit.findMany({
          where: { deleteBatchId, matchId: matchAudit.matchId },
        })

        for (const throwAudit of throwAudits) {
          await tx.playerThrow.create({
            data: {
              id: throwAudit.throwId,
              tournamentId: throwAudit.tournamentId,
              matchId: throwAudit.matchId,
              leg: throwAudit.leg,
              playerId: throwAudit.playerId,
              time: throwAudit.time,
              score: throwAudit.score,
              darts: throwAudit.darts,
              doubles: throwAudit.doubles,
              checkout: throwAudit.checkout,
              undoneAt: throwAudit.undoneAt,
              redoInvalidatedAt: throwAudit.redoInvalidatedAt,
            },
          })
        }
      }

      await tx.throwAudit.deleteMany({ where: { deleteBatchId } })
      await tx.matchAudit.deleteMany({ where: { deleteBatchId } })
      await tx.tournamentAudit.deleteMany({ where: { deleteBatchId } })

      return restoredTournament
    })

    revalidateSharedPaths()
    revalidateAdminPaths([], [tournament.id])
    revalidateTournamentPaths([tournament.id])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Tournament restored.')
}

export async function restoreMatchAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)
  let restoredTournamentId: string | null | undefined

  try {
    const matchId = requireString(formData, 'matchId')
    const match = await prisma.$transaction(async (tx) => {
      const matchAudit = await tx.matchAudit.findFirst({
        where: { matchId },
        orderBy: { deletedAt: 'desc' },
      })

      if (!matchAudit) {
        throw new Error(`Match audit ${matchId} was not found.`)
      }

      const deleteBatchId = requireDeleteBatchId(matchAudit.deleteBatchId, 'Match', matchId)
      restoredTournamentId = matchAudit.tournamentId

      const restoredMatch = await tx.match.create({
        data: {
          id: matchAudit.matchId,
          tournamentId: matchAudit.tournamentId,
          round: matchAudit.round,
          playerAId: matchAudit.playerAId,
          playerAName: matchAudit.playerAName,
          playerAImage: matchAudit.playerAImage,
          playerBId: matchAudit.playerBId,
          playerBName: matchAudit.playerBName,
          playerBImage: matchAudit.playerBImage,
          runTo: matchAudit.runTo,
          playerALegs: matchAudit.playerALegs,
          playerBlegs: matchAudit.playerBlegs,
          isComplete: matchAudit.isComplete,
          firstPlayer: matchAudit.firstPlayer,
        },
      })

      const throwAudits = await tx.throwAudit.findMany({
        where: { deleteBatchId, matchId },
      })

      for (const throwAudit of throwAudits) {
        await tx.playerThrow.create({
          data: {
            id: throwAudit.throwId,
            tournamentId: throwAudit.tournamentId,
            matchId: throwAudit.matchId,
            leg: throwAudit.leg,
            playerId: throwAudit.playerId,
            time: throwAudit.time,
            score: throwAudit.score,
            darts: throwAudit.darts,
            doubles: throwAudit.doubles,
            checkout: throwAudit.checkout,
            undoneAt: throwAudit.undoneAt,
            redoInvalidatedAt: throwAudit.redoInvalidatedAt,
          },
        })
      }

      await tx.throwAudit.deleteMany({ where: { deleteBatchId, matchId } })
      await tx.matchAudit.delete({ where: { id: matchAudit.id } })

      return restoredMatch
    })

    revalidateSharedPaths()
    revalidateAdminPaths([match.id], [restoredTournamentId].filter(Boolean) as string[])
    revalidateTournamentPaths([restoredTournamentId].filter(Boolean) as string[])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Match restored.')
}

export async function restoreThrowAction(formData: FormData) {
  const returnTo = getReturnTo(formData)
  await requireAdminSession(returnTo)

  try {
    const throwId = requireString(formData, 'throwId')
    const playerThrow = await prisma.$transaction(async (tx) => {
      const throwAudit = await tx.throwAudit.findFirst({
        where: { throwId },
        orderBy: { deletedAt: 'desc' },
      })

      if (!throwAudit) {
        throw new Error(`Throw audit ${throwId} was not found.`)
      }

      requireDeleteBatchId(throwAudit.deleteBatchId, 'Throw', throwId)

      const restoredThrow = await tx.playerThrow.create({
        data: {
          id: throwAudit.throwId,
          tournamentId: throwAudit.tournamentId,
          matchId: throwAudit.matchId,
          leg: throwAudit.leg,
          playerId: throwAudit.playerId,
          time: throwAudit.time,
          score: throwAudit.score,
          darts: throwAudit.darts,
          doubles: throwAudit.doubles,
          checkout: throwAudit.checkout,
          undoneAt: throwAudit.undoneAt,
          redoInvalidatedAt: throwAudit.redoInvalidatedAt,
        },
      })

      await tx.throwAudit.delete({
        where: { id: throwAudit.id },
      })

      return restoredThrow
    })

    revalidateSharedPaths()
    revalidateAdminPaths([playerThrow.matchId], [playerThrow.tournamentId])
    revalidateTournamentPaths([playerThrow.tournamentId])
  } catch (error) {
    redirectWithError(returnTo, getErrorMessage(error))
  }

  redirectWithNotice(returnTo, 'Throw restored.')
}
