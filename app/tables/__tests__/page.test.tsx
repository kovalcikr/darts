import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { getActiveTournament } from '@/app/lib/active-tournament'
import ActiveTournamentTablesPage from '../page'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

describe('active tournament tables page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders fixed table links for the active tournament', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({
      id: 't1',
      name: 'Active Cup',
    } as never)

    const element = await ActiveTournamentTablesPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Active Cup')
    expect(html).toContain('href="/tables/11"')
    expect(html).toContain('href="/tables/16"')
    expect(html).not.toContain('/tournaments/t1/tables')
  })

  test('renders an empty state when no active tournament is selected', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await ActiveTournamentTablesPage()

    expect(renderToStaticMarkup(element)).toContain('No active tournament for tables')
  })
})
