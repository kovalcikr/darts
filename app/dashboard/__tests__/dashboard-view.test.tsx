/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { cleanup, render, screen, within } from '@testing-library/react'
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

  test('shows the current leg starter from live dashboard state', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        matches: [{
          raceTo: 3,
          scoreA: 1,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        }],
        liveStates: [{
          leg: 2,
          playerAScoreLeft: 501,
          playerBScoreLeft: 501,
          playerATotalScore: 0,
          playerBTotalScore: 0,
          playerATotalDarts: 0,
          playerBTotalDarts: 0,
          activePlayerId: 'pA',
          startingPlayerId: 'pB',
          lastThrows: [],
        }],
        tableIds: ['1'],
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    const legsRow = await screen.findByLabelText('Player B started this leg. Legs: 0')

    expect(within(legsRow).getByTestId('dashboard-leg-starter-icon')).not.toBeNull()
    expect(screen.getAllByTestId('dashboard-leg-starter-icon')).toHaveLength(1)
    expect(screen.getByLabelText('Player B started this leg')).not.toBeNull()
    expect(screen.queryByText(/Started leg:/)).toBeNull()
  })

  test('renders with null liveState without crashing', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        matches: [{
          raceTo: 3,
          scoreA: 0,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        }],
        liveStates: [null],
        tableIds: ['1'],
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    expect((await screen.findAllByText('Player A')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Started leg:/)).toBeNull()
    expect(screen.queryByTestId('dashboard-leg-starter-icon')).toBeNull()
  })
})