import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { POST } from '../tournaments/open/route'
import { openTournament } from '../lib/tournament'

jest.mock('../lib/tournament', () => ({
  openTournament: jest.fn(),
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

  test('redirects to the opened tournament after a successful POST', async () => {
    jest.mocked(openTournament).mockResolvedValue(undefined)

    const response = await POST(buildRequest({ tournamentId: 'abc' }))

    expect(openTournament).toHaveBeenCalledWith('abc')
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe('http://localhost:3000/tournaments/abc')
  })

  test('redirects back with an error when tournament id is missing', async () => {
    const response = await POST(buildRequest({ tournamentId: '   ' }))

    expect(openTournament).not.toHaveBeenCalled()
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/tournaments?error=Missing%20tournament%20ID'
    )
  })
})
