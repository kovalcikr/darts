import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import PlayersPage from '../page'
import { getRankings } from '@/app/lib/cuescore'

jest.mock('@/app/lib/cuescore', () => ({
  getRankings: jest.fn(),
}))

jest.mock('@/app/components/StatsPageShell', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('players page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('preserves season in player detail links', async () => {
    jest.mocked(getRankings).mockResolvedValue({
      participants: [{ participantId: 'p1', rank: 1, name: 'Alice' }],
    } as never)

    const element = await PlayersPage({
      searchParams: Promise.resolve({ season: '2025' }),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('href="/players/p1?season=2025"')
    expect(html).toContain('Alice')
  })
})
