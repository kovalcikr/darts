import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { createTournament } from '../lib/tournament'
import * as match from '../lib/match'
import getTournamentInfo from '../lib/cuescore'
import * as data from '../lib/data'
import { tournament72952399Fixture } from '../../cuescore/fixtures/tournament-72952399'

jest.mock('../lib/cuescore', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('../lib/data')
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

function cloneFixture() {
  return structuredClone(tournament72952399Fixture)
}

describe('cuescore tournament contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('createTournament maps tournament start metadata from CueScore payload', async () => {
    jest.mocked(data.upsertTournament).mockResolvedValue(null)

    await createTournament(cloneFixture() as any)

    expect(data.upsertTournament).toHaveBeenCalledWith('72952399', {
      name: 'Relax Darts CUP 10 2026',
      season: 2026,
      eventDate: new Date('2026-05-26T16:00:00Z'),
    })
  })

  test('getCuescoreMatch resolves the in-progress table from the real payload shape', async () => {
    jest.mocked(getTournamentInfo).mockResolvedValue(cloneFixture() as any)

    const result = await match.getCuescoreMatch('72952399', '11')

    expect(result.matchId).toBe(80588671)
    expect(result.roundName).toBe('Round 1')
    expect(result.matchstatus).toBe('playing')
    expect(result.table?.name).toBe('11')
  })

  test('getCuescoreMatchCached stringifies numeric CueScore match ids', async () => {
    jest.mocked(getTournamentInfo).mockResolvedValue(cloneFixture() as any)

    const result = await match.getCuescoreMatchCached('72952399', '11')

    expect(result?.matchId).toBe('80588671')
    expect(typeof result?.matchId).toBe('string')
  })

  test('getCuescoreMatch ignores non-playing matches even when table is an array', async () => {
    jest.mocked(getTournamentInfo).mockResolvedValue(cloneFixture() as any)

    await expect(match.getCuescoreMatch('72952399', '12')).rejects.toThrow(
      'No match in progress on table 12'
    )
  })
})
