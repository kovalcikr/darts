import 'server-only'

import { createHash, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const ADMIN_USERNAME_ENV = 'ADMIN_UI_USERNAME'
export const ADMIN_PASSWORD_ENV = 'ADMIN_UI_PASSWORD'
export const ADMIN_SESSION_COOKIE = 'darts-admin-session'

type AdminCredentials = {
  username: string
  password: string
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest()
}

function safeEquals(left: string, right: string) {
  return timingSafeEqual(sha256(left), sha256(right))
}

export function getAdminCredentials(): AdminCredentials | null {
  const username = process.env[ADMIN_USERNAME_ENV]?.trim()
  const password = process.env[ADMIN_PASSWORD_ENV]?.trim()

  if (!username || !password) {
    return null
  }

  return { username, password }
}

export function isAdminConfigured() {
  return getAdminCredentials() !== null
}

export function validateAdminCredentials(username: string, password: string) {
  const configuredCredentials = getAdminCredentials()

  if (!configuredCredentials) {
    return false
  }

  return (
    safeEquals(username, configuredCredentials.username) &&
    safeEquals(password, configuredCredentials.password)
  )
}

export function getAdminSessionToken() {
  const configuredCredentials = getAdminCredentials()

  if (!configuredCredentials) {
    return null
  }

  return createHash('sha256')
    .update(`${configuredCredentials.username}\0${configuredCredentials.password}`)
    .digest('hex')
}

export async function isAdminAuthenticated() {
  const expectedToken = getAdminSessionToken()
  const cookieStore = await cookies()
  const currentToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!expectedToken || !currentToken || currentToken.length !== expectedToken.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(currentToken), Buffer.from(expectedToken))
}
