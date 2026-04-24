/**
 * @jest-environment jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import SeasonSelector from '../SeasonSelector'

const push = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/players/p1',
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams('season=2026&view=cards'),
}))

describe('SeasonSelector', () => {
  beforeEach(() => {
    push.mockClear()
  })

  test('keeps the current route and preserves other search params when season changes', () => {
    render(<SeasonSelector season="2026" />)

    fireEvent.change(screen.getByLabelText('Sezóna'), {
      target: { value: '2025' },
    })

    expect(push).toHaveBeenCalledWith('/players/p1?season=2025&view=cards')
  })

  test('shows pending feedback until the new season prop arrives', () => {
    const { rerender } = render(<SeasonSelector season="2026" />)

    fireEvent.change(screen.getByLabelText('Sezóna'), {
      target: { value: '2025' },
    })

    expect((screen.getByLabelText('Sezóna') as HTMLSelectElement).disabled).toBe(true)
    expect(screen.getByText('Načítavam sezónu 2025...')).not.toBeNull()

    rerender(<SeasonSelector season="2025" />)

    expect((screen.getByLabelText('Sezóna') as HTMLSelectElement).disabled).toBe(false)
    expect(screen.queryByText('Načítavam sezónu 2025...')).toBeNull()
  })
})
