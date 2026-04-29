import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import TournamentTableRedirect from '../page'
import { redirect } from 'next/navigation'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('deprecated explicit tournament table route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redirects to the fixed table route without preserving the tournament id', async () => {
    await TournamentTableRedirect({
      params: Promise.resolve({ id: 'explicit-tournament', table: '11' }),
    })

    expect(redirect).toHaveBeenCalledWith('/tables/11')
  })
})
