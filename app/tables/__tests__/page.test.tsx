import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { getTableMappings } from '@/app/lib/table-mappings'
import ActiveTournamentTablesPage from '../page'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('@/app/lib/table-mappings', () => ({
  getTableMappings: jest.fn(),
}))

describe('active tournament tables page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders one link per configured mapping and skips Slot gaps', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({
      id: 't1',
      name: 'Active Cup',
    } as never)
    jest.mocked(getTableMappings).mockResolvedValue([
      { slot: 1, cuescoreTableName: '11' },
      { slot: 3, cuescoreTableName: '13' },
      { slot: 7, cuescoreTableName: '17' },
    ])

    const element = await ActiveTournamentTablesPage()
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Active Cup')
    expect(html).toContain('href="/tables/1"')
    expect(html).toContain('href="/tables/3"')
    expect(html).toContain('href="/tables/7"')
    expect(html).toContain('Table 1')
    expect(html).toContain('Table 3')
    expect(html).toContain('Table 7')
    expect(html).not.toContain('href="/tables/2"')
    expect(html).not.toContain('href="/tables/6"')
    expect(html).not.toContain('/tournaments/t1/tables')
  })

  test('renders an empty state when no active tournament is selected', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await ActiveTournamentTablesPage()

    expect(renderToStaticMarkup(element)).toContain('No active tournament for tables')
  })
})
