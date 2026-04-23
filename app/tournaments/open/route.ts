import { NextResponse } from 'next/server'

import { openTournament } from '../../lib/tournament'

function getBaseUrl(request: Request) {
  return new URL(request.url).origin
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
    await openTournament(tournamentId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error while opening tournament'
    return NextResponse.redirect(
      new URL(`/tournaments?error=${encodeURIComponent(`Cannot open tournament: ${message}`)}`, baseUrl),
      303
    )
  }

  return NextResponse.redirect(new URL(`/tournaments/${tournamentId}`, baseUrl), 303)
}
