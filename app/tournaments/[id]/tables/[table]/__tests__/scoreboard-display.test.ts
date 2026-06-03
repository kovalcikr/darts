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
    }, 'playerA')).toEqual({
      playerA: 'Fero',
      playerB: 'Jozo',
    })
  })

  test('adds last initials when first names collide and surname initials differ', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Kovalcik',
      other: 'Peter Mrkva',
    }, 'starter')).toEqual({
      starter: 'Peter K.',
      other: 'Peter M.',
    })
  })

  test('uses full surname when first names collide and surname initials are the same but surnames differ', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Kovalcik',
      other: 'Peter Kováčik',
    }, 'starter')).toEqual({
      starter: 'Kovalcik',
      other: 'Kováčik',
    })
  })

  test('falls back to number when first names and full surnames are the same', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Kovalcik',
      other: 'Peter Kovalcik',
    }, 'starter')).toEqual({
      starter: 'Peter 1',
      other: 'Peter 2',
    })
  })

  test('falls back to number when duplicate first names have no surname', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter',
      other: 'Peter',
    }, 'starter')).toEqual({
      starter: 'Peter 1',
      other: 'Peter 2',
    })
  })

  test('starting player gets 1 even when surnames match case-insensitively', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter KOVALCIK',
      other: 'Peter kovalcik',
    }, 'starter')).toEqual({
      starter: 'Peter 1',
      other: 'Peter 2',
    })
  })

  test('initials come from last word of multi-word name', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Van der Berg',
      other: 'Peter Mrkva',
    }, 'starter')).toEqual({
      starter: 'Peter B.',
      other: 'Peter M.',
    })
  })

  test('uses full last-word surname for multi-word names with same initial', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Van der Berg',
      other: 'Peter Banana',
    }, 'starter')).toEqual({
      starter: 'Berg',
      other: 'Banana',
    })
  })

  test('falls back to number when last-word surnames match in multi-word names', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Van der Berg',
      other: 'Peter Berg',
    }, 'starter')).toEqual({
      starter: 'Peter 1',
      other: 'Peter 2',
    })
  })

  test('falls back to number when last-word surnames match case-insensitively in multi-word names', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Van der Berg',
      other: 'Peter van der Berg',
    }, 'starter')).toEqual({
      starter: 'Peter 1',
      other: 'Peter 2',
    })
  })

  test('uses full surname when both have multi-word names with same initial but different last words', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Van der Berg',
      other: 'Peter Van der Banana',
    }, 'starter')).toEqual({
      starter: 'Berg',
      other: 'Banana',
    })
  })

  test('compares last word not first-non-first-name word', () => {
    expect(buildScoreboardPlayerDisplayNames({
      starter: 'Peter Van der Berg',
      other: 'Peter Banana Berg',
    }, 'starter')).toEqual({
      starter: 'Peter 1',
      other: 'Peter 2',
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
