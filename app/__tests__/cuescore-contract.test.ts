import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { createTournament } from '../lib/tournament'
import { ingestCuescoreMatch } from '../lib/match-ingestion'
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

  test('ingestCuescoreMatch finds in-progress match and persists it', async () => {
    jest.mocked(getTournamentInfo).mockResolvedValue(cloneFixture() as any)
    jest.mocked(data.upsertMatch).mockResolvedValue({ id: 'persisted-match-1' } as any)

    const result = await ingestCuescoreMatch('72952399', '11', '1')

    expect(data.upsertMatch).toHaveBeenCalledWith(
      expect.objectContaining({ matchId: 80588671, roundName: 'Round 1', matchstatus: 'playing' }),
      '1',
    )
    expect(result).toEqual({ id: 'persisted-match-1' })
  })

  test('ingestCuescoreMatch throws when table has no match in progress', async () => {
    jest.mocked(getTournamentInfo).mockResolvedValue(cloneFixture() as any)

    await expect(ingestCuescoreMatch('72952399', '12', '1')).rejects.toThrow(
      'No match in progress on table 12'
    )
  })
})