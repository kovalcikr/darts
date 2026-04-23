import { describe, expect, test } from '@jest/globals'
import { getDatabaseUrl } from '../lib/database-url'

describe('getDatabaseUrl', () => {
  test('prefers the pooled runtime URL by default', () => {
    const databaseUrl = getDatabaseUrl({
      env: {
        POSTGRES_PRISMA_URL: 'postgresql://runtime',
        POSTGRES_URL_NON_POOLING: 'postgresql://direct',
      } as NodeJS.ProcessEnv,
    })

    expect(databaseUrl).toBe('postgresql://runtime')
  })

  test('prefers the non-pooling URL when requested', () => {
    const databaseUrl = getDatabaseUrl({
      env: {
        POSTGRES_PRISMA_URL: 'postgresql://runtime',
        POSTGRES_URL_NON_POOLING: 'postgresql://direct',
      } as NodeJS.ProcessEnv,
      preferNonPooling: true,
    })

    expect(databaseUrl).toBe('postgresql://direct')
  })

  test('returns an empty string when the URL is optional', () => {
    const databaseUrl = getDatabaseUrl({
      env: {} as NodeJS.ProcessEnv,
      required: false,
    })

    expect(databaseUrl).toBe('')
  })

  test('throws when no database URL is configured for runtime use', () => {
    expect(() =>
      getDatabaseUrl({
        env: {} as NodeJS.ProcessEnv,
      }),
    ).toThrow(
      'Missing database configuration. Set POSTGRES_PRISMA_URL or POSTGRES_URL_NON_POOLING.',
    )
  })
})
