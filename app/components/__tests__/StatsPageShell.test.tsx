import { describe, expect, jest, test } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import StatsPageShell from '../StatsPageShell'

jest.mock('../SeasonSelector', () => ({
  __esModule: true,
  default: ({ season }: { season: string }) => <div data-season-selector="true">{season}</div>,
}))

describe('StatsPageShell', () => {
  test('renders section navigation with preserved season query', () => {
    const html = renderToStaticMarkup(
      <StatsPageShell activeSection="players" season="2025" title="Players">
        <div>Body</div>
      </StatsPageShell>
    )

    expect(html).toContain('href="/?season=2025"')
    expect(html).toContain('href="/players?season=2025"')
    expect(html).toContain('href="/stats/tournaments?season=2025"')
    expect(html).toContain('href="/dashboard?season=2025"')
    expect(html).toContain('data-season-selector="true"')
  })

  test('can hide the season selector while keeping season-aware navigation', () => {
    const html = renderToStaticMarkup(
      <StatsPageShell
        activeSection="tournaments"
        season="2026"
        showSeasonSelector={false}
        title="Tournament"
      >
        <div>Body</div>
      </StatsPageShell>
    )

    expect(html).toContain('href="/stats/tournaments?season=2026"')
    expect(html).not.toContain('data-season-selector="true"')
  })
})
