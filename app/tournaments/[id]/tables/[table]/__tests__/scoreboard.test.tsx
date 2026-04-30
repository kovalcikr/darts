/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import type { ScoreboardThrowHistoryItem } from '@/app/lib/model/fullmatch';
import ScoreBoard, { CheckoutDartsSelector } from '../scoreboard';

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

function makeThrowHistory(playerIds: string[]): ScoreboardThrowHistoryItem[] {
  return playerIds.map((playerId, index) => ({
    id: `throw-${index + 1}`,
    playerId,
    score: [180, 140, 100, 60, 45, 26][index],
    darts: 3,
    checkout: false,
    leg: 1,
    status: index === 2 ? 'undone' : 'active',
    activityTime: new Date(`2026-01-01T00:00:0${index}.000Z`),
  }));
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

describe('ScoreBoard throw history layout', () => {
  test('keeps all six throw entries rendered when player names are very long', () => {
    const throwHistory = makeThrowHistory([
      'long-single-word',
      'long-multi-word',
      'unicode-name',
      'long-single-word',
      'long-multi-word',
      'unicode-name',
    ]);

    const { container } = render(
      <ScoreBoard
        tournamentId="tournament-1"
        matchId="match-1"
        leg={1}
        player="long-single-word"
        currentPlayerScore={501}
        slow={false}
        table="1"
        throwHistory={throwHistory}
        playerNames={{
          'long-single-word': 'AlexandertheGreatestDartsPlayerWithAnExtremelyLongUnbrokenName',
          'long-multi-word': 'Bernard The Very Persistent Tactical Checkout Specialist',
          'unicode-name': 'Žofia Šampiónová Extra Long Display Name',
        }}
        playerAccents={{
          'long-single-word': 'left',
          'long-multi-word': 'right',
          'unicode-name': 'left',
        }}
      />
    );

    const historySlots = screen.getByTestId('scoreboard-throw-history-slots');

    expect(historySlots.className).toContain('grid-cols-6');
    expect(historySlots.className).toContain('flex-1');
    expect(historySlots.className).toContain('min-w-0');

    const throwEntries = container.querySelectorAll(
      '[data-testid^="scoreboard-history-active-"], [data-testid^="scoreboard-history-undone-"]'
    );

    expect(throwEntries).toHaveLength(6);
    expect(screen.getByTestId('scoreboard-history-player-throw-1').className).toContain('truncate');
    expect(screen.getByTestId('scoreboard-history-player-throw-1').className).toContain('min-w-0');
    expect(screen.getByTestId('scoreboard-history-player-throw-2').textContent).toContain('Bernard');
    expect(screen.getByTestId('scoreboard-history-player-throw-3').textContent).toContain('Žofia');
    expect(screen.getByTestId('scoreboard-history-active-throw-1').textContent).toContain('180');
    expect(screen.getByTestId('scoreboard-history-active-throw-6').textContent).toContain('26');
  });
});
