/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { cleanup, render, screen } from '@testing-library/react'
import DashboardView from '../dashboard-view'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/app/components/NoActiveTournament', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}))

describe('DashboardView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  test('renders inactive state when the active tournament disappears while polling', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: { code: 'ACTIVE_TOURNAMENT_NOT_SET' },
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    expect(await screen.findByText('No active tournaments')).not.toBeNull()
    expect(screen.queryByText('Error: Failed to fetch server data')).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('/api/dashboard')
  })
})
