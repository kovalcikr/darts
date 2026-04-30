/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { CheckoutDartsSelector } from '../scoreboard';

jest.mock('@/app/lib/playerThrow', () => ({
  addThrowAction: jest.fn(),
  redoThrow: jest.fn(),
  undoThrow: jest.fn(),
}));

function CheckoutDartsSelectorHarness({
  initialSelectedDarts,
  remainingScore,
}: {
  initialSelectedDarts: number | null
  remainingScore: number
}) {
  const [selectedDarts, setSelectedDarts] = useState<number | null>(initialSelectedDarts);

  return (
    <CheckoutDartsSelector
      remainingScore={remainingScore}
      selectedDarts={selectedDarts}
      onSelectedDartsChange={setSelectedDarts}
    />
  );
}

describe('CheckoutDartsSelector', () => {
  test('disables impossible checkout dart counts', async () => {
    render(<CheckoutDartsSelectorHarness initialSelectedDarts={null} remainingScore={131} />);

    expect(screen.getByLabelText('1')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('2')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('3')).toHaveProperty('disabled', false);
    await waitFor(() => expect(screen.getByLabelText('3')).toHaveProperty('checked', true));
  });

  test('resets a selected dart count when the remaining score makes it invalid', async () => {
    const { rerender } = render(
      <CheckoutDartsSelectorHarness initialSelectedDarts={1} remainingScore={40} />
    );

    expect(screen.getByLabelText('1')).toHaveProperty('checked', true);

    rerender(<CheckoutDartsSelectorHarness initialSelectedDarts={1} remainingScore={100} />);

    await waitFor(() => expect(screen.getByLabelText('1')).toHaveProperty('checked', false));
    expect(screen.getByLabelText('2')).toHaveProperty('checked', false);
    expect(screen.getByLabelText('3')).toHaveProperty('checked', false);
  });
});
