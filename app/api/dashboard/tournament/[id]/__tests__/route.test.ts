import { describe, expect, test } from '@jest/globals'
import { GET } from '../route'

describe('/api/dashboard/tournament/[id] deprecated route', () => {
  test('returns gone for explicit tournament dashboard requests', async () => {
    const response = await GET(new Request('http://localhost:3000/api/dashboard/tournament/t1') as never, {
      params: Promise.resolve({ id: 't1' }),
    })
    const body = await response.json()

    expect(response.status).toBe(410)
    expect(body.error.code).toBe('DASHBOARD_TOURNAMENT_DEPRECATED')
  })
})
