import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { GET } from '../api/tournaments/[id]/route';
import getTournamentInfo from '../lib/cuescore';

jest.mock('../lib/cuescore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('/api/tournaments/[id] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns tournament info on success', async () => {
    jest.mocked(getTournamentInfo).mockResolvedValue({ tournamentId: 't1', name: 'Tournament' } as never);

    const response = await GET(new Request('http://localhost:3000/api/tournaments/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(getTournamentInfo).toHaveBeenCalledWith('t1');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ tournamentId: 't1', name: 'Tournament' });
  });

  test('returns the legacy string error when tournament loading fails', async () => {
    jest.mocked(getTournamentInfo).mockRejectedValue(new Error('boom'));

    const response = await GET(new Request('http://localhost:3000/api/tournaments/t1'), {
      params: Promise.resolve({ id: 't1' }),
    });

    expect(getTournamentInfo).toHaveBeenCalledWith('t1');
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Unable to load tournament info' });
  });
});
