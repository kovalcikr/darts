import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import DeprecatedTournamentDashboardPage from '../page'
import { redirect } from 'next/navigation'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('deprecated explicit tournament dashboard route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('redirects to the active dashboard route', () => {
    DeprecatedTournamentDashboardPage()

    expect(redirect).toHaveBeenCalledWith('/dashboard')
  })
})
