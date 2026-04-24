import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import TournamentsPage from '../page'
import { getCachedTournaments } from '@/app/lib/tournament'

jest.mock('@/app/lib/tournament', () => ({
  getCachedTournaments: jest.fn(),
}))

jest.mock('@/app/components/StatsPageShell', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('stats tournaments page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders included and excluded tournaments in separate sections', async () => {
    jest.mocked(getCachedTournaments).mockResolvedValue({
      included: [
        {
          id: 't1',
          name: 'Included Tournament',
          season: 2026,
          eventDate: new Date('2026-04-23T00:00:00.000Z'),
          includeInGlobalStats: true,
        },
      ],
      excluded: [
        {
          id: 't2',
          name: 'Excluded Tournament',
          season: 2026,
          eventDate: new Date('2026-04-24T00:00:00.000Z'),
          includeInGlobalStats: false,
        },
      ],
    } as never)

    const element = await TournamentsPage({
      searchParams: Promise.resolve({ season: '2026' }),
    })

    const html = renderToStaticMarkup(element)

    expect(html).toContain('Included Tournament')
    expect(html).toContain('href="/stats/tournaments/t1?season=2026"')
    expect(html).toContain('Nebodované turnaje')
    expect(html).toContain('Excluded Tournament')
    expect(html).toContain('href="/stats/tournaments/t2?season=2026"')
  })
})
