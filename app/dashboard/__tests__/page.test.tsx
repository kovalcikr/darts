import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { getActiveTournament } from '@/app/lib/active-tournament'
import ActiveTournamentDashboardPage from '../page'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('../dashboard-view', () => ({
  __esModule: true,
  default: () => <div>Active dashboard</div>,
}))

describe('active tournament dashboard page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders dashboard for the active tournament', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({
      id: 't1',
      name: 'Active Cup',
    } as never)

    const element = await ActiveTournamentDashboardPage()

    expect(renderToStaticMarkup(element)).toContain('Active dashboard')
  })

  test('renders an empty state when no active tournament is selected', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await ActiveTournamentDashboardPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('No active tournaments')
    expect(html).not.toContain('Open Admin')
    expect(html).not.toContain('Set an active tournament')
  })
})
