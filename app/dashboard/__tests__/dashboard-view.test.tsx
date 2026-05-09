/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { cleanup, render, screen, within } from '@testing-library/react'
import DashboardView from '../dashboard-view'
import { fetchDashboardSnapshot } from '../actions'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('../actions', () => ({
  fetchDashboardSnapshot: jest.fn(),
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
    jest.mocked(fetchDashboardSnapshot).mockResolvedValue(null)

    render(<DashboardView />)

    expect(await screen.findByText('No active tournaments')).not.toBeNull()
    expect(screen.queryByText('Error: Failed to fetch server data')).toBeNull()
  })

  test('shows the current leg starter from live dashboard state', async () => {
    jest.mocked(fetchDashboardSnapshot).mockResolvedValue({
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
    })

    render(<DashboardView />)

    const legsRow = await screen.findByLabelText('Player B started this leg. Legs: 0')

    expect(within(legsRow).getByTestId('dashboard-leg-starter-icon')).not.toBeNull()
    expect(screen.getAllByTestId('dashboard-leg-starter-icon')).toHaveLength(1)
    expect(screen.getByLabelText('Player B started this leg')).not.toBeNull()
    expect(screen.queryByText(/Started leg:/)).toBeNull()
  })

  test('renders with null liveState without crashing', async () => {
    jest.mocked(fetchDashboardSnapshot).mockResolvedValue({
      matches: [{
        raceTo: 3,
        scoreA: 0,
        scoreB: 0,
        playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
        playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
      }],
      liveStates: [null],
      tableIds: ['1'],
    })

    render(<DashboardView />)

    expect((await screen.findAllByText('Player A')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Started leg:/)).toBeNull()
    expect(screen.queryByTestId('dashboard-leg-starter-icon')).toBeNull()
  })
})