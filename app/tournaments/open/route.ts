import { NextResponse } from 'next/server'

import { openActiveTournament } from '../../lib/tournament'

function getBaseUrl(request: Request) {
  const host = request.headers.get('host') ?? new URL(request.url).host
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const tournamentId = String(formData.get('tournamentId') ?? '').trim()
  const baseUrl = getBaseUrl(request)

  if (!tournamentId) {
    return NextResponse.redirect(
      new URL('/tournaments?error=Missing%20tournament%20ID', baseUrl),
      303
    )
  }

  try {
    await openActiveTournament(tournamentId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error while opening tournament'
    return NextResponse.redirect(
      new URL(`/tournaments?error=${encodeURIComponent(`Cannot open tournament: ${message}`)}`, baseUrl),
      303
    )
  }

  return NextResponse.redirect(new URL('/tables', baseUrl), 303)
}
