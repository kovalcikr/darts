import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import ExplicitTournamentTablePage from '../page'
import TableScoreboardPage from '@/app/tournaments/table-scoreboard-page'

jest.mock('@/app/tournaments/table-scoreboard-page', () => ({
  __esModule: true,
  default: jest.fn(({ encodedTable, tournamentId }: { encodedTable: string; tournamentId: string }) => (
    <div>Explicit table {encodedTable} for {tournamentId}</div>
  )),
}))

const tableScoreboardMock = TableScoreboardPage as unknown as jest.Mock

describe('explicit tournament table page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('keeps using the tournament id from the URL', async () => {
    const element = await ExplicitTournamentTablePage({
      params: Promise.resolve({ id: 'explicit-tournament', table: '11' }),
      searchParams: Promise.resolve({ reset: 'true' }),
    })

    expect(renderToStaticMarkup(element)).toContain('Explicit table 11 for explicit-tournament')
    expect(tableScoreboardMock).toHaveBeenCalledWith({
      encodedTable: '11',
      searchParams: { reset: 'true' },
      tournamentId: 'explicit-tournament',
    }, undefined)
  })
})
