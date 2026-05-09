import { describe, expect, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import ActiveTournamentDashboardPage from '../page'

jest.mock('../dashboard-view', () => ({
  __esModule: true,
  default: () => <div>Active dashboard</div>,
}))

describe('active tournament dashboard page', () => {
  test('renders the dashboard view', async () => {
    const element = await ActiveTournamentDashboardPage()

    expect(renderToStaticMarkup(element)).toContain('Active dashboard')
  })
})