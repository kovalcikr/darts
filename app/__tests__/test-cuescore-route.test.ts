import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../api/test/cuescore/route';

describe('/api/test/cuescore route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_TEST_API;
    delete process.env.CUESCORE_PROVIDER;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns the legacy string error when the test api is disabled', async () => {
    const response = await GET(new NextRequest('http://localhost:3000/api/test/cuescore?tournamentId=abc'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Not found' });
  });

  test('returns the legacy string error when tournamentId is missing', async () => {
    process.env.ENABLE_TEST_API = 'true';
    process.env.CUESCORE_PROVIDER = 'fake';

    const response = await GET(new NextRequest('http://localhost:3000/api/test/cuescore'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing tournamentId' });
  });
});
