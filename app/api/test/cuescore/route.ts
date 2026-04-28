import { getCueScoreProviderName } from '@/app/lib/integrations/cuescore'
import { getFakeCueScoreSnapshot, resetFakeCueScoreStore } from '@/app/lib/integrations/cuescore/fake'
import { apiError } from '@/app/api/_lib/responses'
import { NextRequest, NextResponse } from 'next/server'

function isTestCueScoreApiEnabled() {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_TEST_API === 'true' &&
    getCueScoreProviderName() === 'fake'
  )
}

function notFoundResponse() {
  return apiError('NOT_FOUND', 'Not found', { status: 404 })
}

export async function GET(request: NextRequest) {
  if (!isTestCueScoreApiEnabled()) {
    return notFoundResponse()
  }

  const tournamentId = request.nextUrl.searchParams.get('tournamentId')?.trim()
  if (!tournamentId) {
    return apiError('MISSING_TOURNAMENT_ID', 'Missing tournamentId', { status: 400 })
  }

  return NextResponse.json(getFakeCueScoreSnapshot(tournamentId))
}

export async function POST(request: NextRequest) {
  if (!isTestCueScoreApiEnabled()) {
    return notFoundResponse()
  }

  const body = await request.json().catch(() => ({}))
  const tournamentId =
    typeof body?.tournamentId === 'string' && body.tournamentId.trim().length > 0
      ? body.tournamentId.trim()
      : undefined

  resetFakeCueScoreStore(tournamentId)
  return NextResponse.json({ ok: true })
}
