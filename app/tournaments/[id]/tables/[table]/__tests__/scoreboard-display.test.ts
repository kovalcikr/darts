import { describe, expect, test } from '@jest/globals'
import {
  buildScoreboardPlayerDisplayNames,
  getPlayerCardAccentClassName,
  getThrowHistoryAccentClassName,
} from '../scoreboard-display'

describe('scoreboard display helpers', () => {
  test('uses first names when they are unique', () => {
    expect(buildScoreboardPlayerDisplayNames({
      playerA: 'Fero Hruska',
      playerB: 'Jozo Mrkva',
    })).toEqual({
      playerA: 'Fero',
      playerB: 'Jozo',
    })
  })

  test('adds last initials only when first names collide', () => {
    expect(buildScoreboardPlayerDisplayNames({
      playerA: 'Peter Kovalcik',
      playerB: 'Peter Mrkva',
    })).toEqual({
      playerA: 'Peter K.',
      playerB: 'Peter M.',
    })
  })

  test('falls back to a stable number when duplicate first names have no last initial', () => {
    expect(buildScoreboardPlayerDisplayNames({
      playerA: 'Peter',
      playerB: 'Peter',
    })).toEqual({
      playerA: 'Peter 1',
      playerB: 'Peter 2',
    })
  })

  test('uses matching player-card and throw-history accent colors', () => {
    expect(getPlayerCardAccentClassName('left')).toContain('border-emerald-400')
    expect(getThrowHistoryAccentClassName('left', false)).toContain('border-emerald-400')
    expect(getThrowHistoryAccentClassName('left', true)).toContain('border-emerald-300')

    expect(getPlayerCardAccentClassName('right')).toContain('border-amber-400')
    expect(getThrowHistoryAccentClassName('right', false)).toContain('border-amber-400')
    expect(getThrowHistoryAccentClassName('right', true)).toContain('border-amber-300')
  })
})
