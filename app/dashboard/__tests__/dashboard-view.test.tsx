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
        match1: {
          raceTo: 3,
          scoreA: 1,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        },
        matchInfo1: { score: [] },
        liveState1: {
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
        },
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

  test('derives the dashboard leg starter from first player fallback state', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        match1: {
          raceTo: 3,
          scoreA: 1,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        },
        matchInfo1: {
          score: [
            { playerId: 'pA', _sum: { score: 60 }, _count: { score: 1 } },
            { playerId: 'pB', _sum: { score: 0 }, _count: { score: 0 } },
          ],
          lastThrows: [],
        },
        firstPlayer1: 'pA',
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    const legsRow = await screen.findByLabelText('Player B started this leg. Legs: 0')

    expect(within(legsRow).getByTestId('dashboard-leg-starter-icon')).not.toBeNull()
    expect(screen.getAllByTestId('dashboard-leg-starter-icon')).toHaveLength(1)
  })

  test('does not crash when dashboard starter data is missing', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        match1: {
          raceTo: 3,
          scoreA: 0,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        },
        matchInfo1: { score: [], lastThrows: [] },
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    expect((await screen.findAllByText('Player A')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Started leg:/)).toBeNull()
    expect(screen.queryByTestId('dashboard-leg-starter-icon')).toBeNull()
  })

  test('keeps playerA on the left when firstPlayer is playerA', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        match1: {
          raceTo: 3,
          scoreA: 0,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        },
        matchInfo1: { score: [], lastThrows: [] },
        firstPlayer1: 'pA',
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    const playerAImg = await screen.findByAltText('Player Player A - 1')
    const playerBImg = screen.getByAltText('Player Player B - 2')

    expect(playerAImg.compareDocumentPosition(playerBImg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('truncates long player names and fits the throw list inside the dashboard card', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        match1: {
          raceTo: 3,
          scoreA: 1,
          scoreB: 1,
          playerA: { playerId: 'pA', name: 'AlexandertheGreatestDartsPlayerWithAnExtremelyLongUnbrokenName', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Bernardine-Wollheim-Smythová III of Ceredigion', image: '/b.png' },
        },
        matchInfo1: {
          score: [
            { playerId: 'pA', _sum: { score: 60 }, _count: { score: 1 } },
            { playerId: 'pB', _sum: { score: 180 }, _count: { score: 3 } },
          ],
          lastThrows: [
            { playerId: 'pA', score: 100 },
            { playerId: 'pA', score: 140 },
            { playerId: 'pA', score: 180 },
            { playerId: 'pB', score: 45 },
            { playerId: 'pB', score: 60 },
            { playerId: 'pB', score: 180 },
          ],
        },
        firstPlayer1: 'pA',
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    await screen.findByText('AlexandertheGreatestDartsPlayerWithAnExtremelyLongUnbrokenName')

    const tableCell = document.querySelector('[data-testid="dashboard-table-1"]') as HTMLElement
    expect(tableCell).not.toBeNull()

    const playerHeadings = Array.from(tableCell.querySelectorAll('h2')).filter(
      (h) => h.textContent?.includes('AlexandertheGreatest') || h.textContent?.includes('Bernardine'),
    )
    expect(playerHeadings.length).toBe(2)
    playerHeadings.forEach((heading) => {
      const headingEl = heading as HTMLElement
      expect(headingEl.className).toContain('min-w-0')
      expect(headingEl.className).toContain('overflow-hidden')
      const inner = headingEl.querySelector('span')
      expect(inner).not.toBeNull()
      expect((inner as HTMLElement).className).toContain('truncate')
    })

    const throwContainers = Array.from(tableCell.querySelectorAll('p'))
    const throwList = throwContainers.find((p) => p.textContent?.match(/100.*140.*180/) || p.textContent?.match(/45.*60.*180/))
    expect(throwList).toBeDefined()
    expect((throwList as HTMLElement).className).toContain('truncate')
  })

  test('puts playerB on the left when firstPlayer is playerB (matches scoreboard swap)', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({
        match1: {
          raceTo: 3,
          scoreA: 0,
          scoreB: 0,
          playerA: { playerId: 'pA', name: 'Player A', image: '/a.png' },
          playerB: { playerId: 'pB', name: 'Player B', image: '/b.png' },
        },
        matchInfo1: { score: [], lastThrows: [] },
        firstPlayer1: 'pB',
      }),
    } as Response)
    global.fetch = fetchMock

    render(<DashboardView />)

    const playerAImg = await screen.findByAltText('Player Player A - 2')
    const playerBImg = screen.getByAltText('Player Player B - 1')

    expect(playerBImg.compareDocumentPosition(playerAImg) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
