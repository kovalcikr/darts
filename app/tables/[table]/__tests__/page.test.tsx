import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { getActiveTournament } from '@/app/lib/active-tournament'
import ActiveTournamentTablePage from '../page'
import TableScoreboardPage from '@/app/tournaments/table-scoreboard-page'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('@/app/tournaments/table-scoreboard-page', () => ({
  __esModule: true,
  default: jest.fn(({ encodedTable, tournamentId }: { encodedTable: string; tournamentId: string }) => (
    <div>Table {encodedTable} for {tournamentId}</div>
  )),
}))

const tableScoreboardMock = TableScoreboardPage as unknown as jest.Mock

describe('active tournament table page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the scoreboard for the active tournament', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({
      id: 't1',
      name: 'Active Cup',
    } as never)

    const element = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '11' }),
      searchParams: Promise.resolve({ slow: 'true' }),
    })

    expect(renderToStaticMarkup(element)).toContain('Table 11 for t1')
    expect(tableScoreboardMock).toHaveBeenCalledWith({
      encodedTable: '11',
      searchParams: { slow: 'true' },
      tournamentId: 't1',
    }, undefined)
  })

  test('renders an empty state when no active tournament is selected', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '11' }),
      searchParams: Promise.resolve({}),
    })
    const html = renderToStaticMarkup(element)

    expect(html).toContain('No active tournament for this table')
    expect(html).not.toContain('Open Admin')
    expect(html).not.toContain('Set an active tournament')
  })
})
