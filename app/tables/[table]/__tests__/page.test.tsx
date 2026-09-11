import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { getActiveTournament } from '@/app/lib/active-tournament'
import { getTableMappingBySlot } from '@/app/lib/table-mappings'
import ActiveTournamentTablePage from '../page'
import TableScoreboardPage from '@/app/tournaments/table-scoreboard-page'

jest.mock('@/app/lib/active-tournament', () => ({
  getActiveTournament: jest.fn(),
}))

jest.mock('@/app/lib/table-mappings', () => ({
  getTableMappingBySlot: jest.fn(),
}))

jest.mock('@/app/tournaments/table-scoreboard-page', () => ({
  __esModule: true,
  default: jest.fn(({ encodedTable, tournamentId }: { encodedTable: string; tournamentId: string }) => (
    <div>Table {encodedTable} for {tournamentId}</div>
  )),
}))

const tableScoreboardMock = TableScoreboardPage as unknown as jest.Mock
const tableMappingMock = getTableMappingBySlot as jest.MockedFunction<typeof getTableMappingBySlot>

describe('active tournament table page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    tableMappingMock.mockResolvedValue({ slot: 1, cuescoreTableName: '11' })
  })

  test('renders the scoreboard for the active tournament', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue({
      id: 't1',
      name: 'Active Cup',
    } as never)
    tableMappingMock.mockResolvedValue({ slot: 1, cuescoreTableName: 'configured-table' })

    const element = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '1' }),
    })

    expect(renderToStaticMarkup(element)).toContain('Table 1 for t1')
    expect(tableScoreboardMock).toHaveBeenCalledWith({
      encodedTable: '1',
      tournamentId: 't1',
      mapping: { slot: 1, cuescoreTableName: 'configured-table' },
    }, undefined)
  })

  test('observes a remapping on the next live refresh', async () => {
    jest.mocked(getActiveTournament)
      .mockResolvedValueOnce({ id: 't1', name: 'Active Cup' } as never)
      .mockResolvedValueOnce({ id: 't1', name: 'Active Cup' } as never)
    tableMappingMock
      .mockResolvedValueOnce({ slot: 1, cuescoreTableName: 'old-table' })
      .mockResolvedValueOnce({ slot: 1, cuescoreTableName: 'new-table' })

    const firstElement = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '1' }),
    })
    const secondElement = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '1' }),
    })

    renderToStaticMarkup(firstElement)
    renderToStaticMarkup(secondElement)

    expect(getActiveTournament).toHaveBeenCalledTimes(2)
    expect(tableMappingMock).toHaveBeenCalledTimes(2)
    expect(tableScoreboardMock).toHaveBeenNthCalledWith(1, {
      encodedTable: '1',
      tournamentId: 't1',
      mapping: { slot: 1, cuescoreTableName: 'old-table' },
    }, undefined)
    expect(tableScoreboardMock).toHaveBeenNthCalledWith(2, {
      encodedTable: '1',
      tournamentId: 't1',
      mapping: { slot: 1, cuescoreTableName: 'new-table' },
    }, undefined)
  })

  test('renders a removed state for a Slot absent from the configuration', async () => {
    tableMappingMock.mockResolvedValue(null)

    const element = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '3' }),
    })

    expect(renderToStaticMarkup(element)).toContain('Table not available')
    expect(getActiveTournament).not.toHaveBeenCalled()
    expect(tableScoreboardMock).not.toHaveBeenCalled()
  })

  test('renders an empty state when no active tournament is selected', async () => {
    jest.mocked(getActiveTournament).mockResolvedValue(null)

    const element = await ActiveTournamentTablePage({
      params: Promise.resolve({ table: '1' }),
    })
    const html = renderToStaticMarkup(element)

    expect(html).toContain('No active tournament for this table')
    expect(html).not.toContain('Open Admin')
    expect(html).not.toContain('Set an active tournament')
  })
})
