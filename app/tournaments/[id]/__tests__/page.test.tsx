import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import TournamentTablesRedirect from '../page'
import { redirect } from 'next/navigation'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('deprecated explicit tournament table selector route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redirects to the active tournament tables route', () => {
    TournamentTablesRedirect()

    expect(redirect).toHaveBeenCalledWith('/tables')
  })
})
