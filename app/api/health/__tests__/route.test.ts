import { describe, expect, test } from '@jest/globals'
import { readFileSync } from 'fs'
import path from 'path'
import { GET } from '../route'

function getModuleSpecifiers(source: string) {
  return Array.from(
    source.matchAll(/^\s*import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]/gm),
    (match) => match[1]
  )
}

describe('/api/health route', () => {
  test('returns a non-cacheable ok response', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  test('imports next/server and nothing else', () => {
    const source = readFileSync(path.join(__dirname, '..', 'route.ts'), 'utf8')

    expect(getModuleSpecifiers(source)).toEqual(['next/server'])
  })
})
