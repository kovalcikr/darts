import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { POST } from '../tournaments/open/route'
import { openActiveTournament } from '../lib/tournament'

jest.mock('../lib/tournament', () => ({
  openActiveTournament: jest.fn(),
}))

function buildRequest(formValues: Record<string, string>) {
  return new Request('http://localhost:3000/tournaments/open', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(formValues),
  })
}

describe('/tournaments/open route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('sets the opened tournament active and redirects to fixed tables after a successful POST', async () => {
    jest.mocked(openActiveTournament).mockResolvedValue(undefined)

    const response = await POST(buildRequest({ tournamentId: 'abc' }))

    expect(openActiveTournament).toHaveBeenCalledWith('abc')
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('http://localhost:3000/tables')
  })

  test('redirects back with an error when tournament id is missing', async () => {
    const response = await POST(buildRequest({ tournamentId: '   ' }))

    expect(openActiveTournament).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/tournaments?error=Missing%20tournament%20ID'
    )
  })
})
