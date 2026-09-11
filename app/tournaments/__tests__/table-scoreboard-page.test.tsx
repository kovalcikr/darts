import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { createMatch, getCuescoreMatch } from '@/app/lib/match'
import TableScoreboardPage from '../table-scoreboard-page'

jest.mock('@/app/lib/match', () => ({
  createMatch: jest.fn(),
  getCuescoreMatch: jest.fn(),
}))

jest.mock('../[id]/tables/[table]/darts', () => ({
  __esModule: true,
  default: ({ table, matchId, tournamentId }: { table: string; matchId: string; tournamentId: string }) => (
    <div>{table}:{matchId}:{tournamentId}</div>
  ),
}))

jest.mock('../[id]/tables/[table]/wait', () => ({
  __esModule: true,
  default: () => <div>Wait</div>,
}))

describe('table scoreboard page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getCuescoreMatch).mockResolvedValue({ id: 'cue-match' } as never)
    jest.mocked(createMatch).mockResolvedValue({ id: 'local-match' } as never)
  })

  test('uses the current CueScore Table Name while preserving the Slot', async () => {
    const element = await TableScoreboardPage({
      encodedTable: '4',
      tournamentId: 't1',
      mapping: { slot: 4, cuescoreTableName: 'remapped-table' },
    })

    expect(getCuescoreMatch).toHaveBeenCalledWith('t1', 'remapped-table')
    expect(createMatch).toHaveBeenCalledWith({ id: 'cue-match' }, '4')
    expect(renderToStaticMarkup(element)).toContain('4:local-match:t1')
  })
})
