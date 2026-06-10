import { getCueScoreProviderName } from '@/app/lib/integrations/cuescore'
import { getFakeCueScoreSnapshot, resetFakeCueScoreStore, setFakeCueScoreDelay } from '@/app/lib/integrations/cuescore/fake'
import { NextRequest, NextResponse } from 'next/server'

function isTestCueScoreApiEnabled() {
  const fakeProvider = getCueScoreProviderName() === 'fake'
  const explicitlyEnabled = process.env.ENABLE_TEST_API === 'true'

  if (!fakeProvider || !explicitlyEnabled) {
    return false
  }

  if (process.env.NODE_ENV === 'production') {
    return process.env.ENABLE_TEST_ROUTES_IN_PRODUCTION === 'true'
  }

  return true
}

function notFoundResponse() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function GET(request: NextRequest) {
  if (!isTestCueScoreApiEnabled()) {
    return notFoundResponse()
  }

  const tournamentId = request.nextUrl.searchParams.get('tournamentId')?.trim()
  if (!tournamentId) {
    return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 })
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

  if (body?.delays && typeof body.delays === 'object') {
    for (const [method, ms] of Object.entries(body.delays)) {
      if (typeof ms === 'number') {
        setFakeCueScoreDelay(method, ms)
      }
    }
  }

  resetFakeCueScoreStore(tournamentId)
  return NextResponse.json({ ok: true })
}
