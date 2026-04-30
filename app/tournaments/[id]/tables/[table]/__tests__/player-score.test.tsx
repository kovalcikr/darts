/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import PlayerScore from '../player-score';
import { selectCurrentLegStarter } from '@/app/lib/leg-starter';
import type { Player } from '@/app/lib/model/fullmatch';

function makePlayer(id: string, name: string, active = false): Player {
  return {
    id,
    name,
    active,
    imageUrl: '/player.png',
    score: 501,
    dartsCount: 0,
    lastThrow: 0,
    matchAvg: 0,
    legCount: 0,
    highestScore: 0,
    bestCheckout: 0,
    bestLeg: 0,
  };
}

function renderPlayers({
  leg,
  firstPlayer = 'pA',
  activePlayer = 'pA',
}: {
  leg: number
  firstPlayer?: string | null
  activePlayer?: string
}) {
  const playerA = makePlayer('pA', 'Player A', activePlayer === 'pA');
  const playerB = makePlayer('pB', 'Player B', activePlayer === 'pB');
  const starter = selectCurrentLegStarter({
    leg,
    playerAId: playerA.id,
    playerBId: playerB.id,
    firstPlayer,
  });

  return render(
    <>
      <div data-testid="player-a" data-active={playerA.active ? 'true' : 'false'}>
        <PlayerScore player={playerA} startedLeg={starter === playerA.id} />
      </div>
      <div data-testid="player-b" data-active={playerB.active ? 'true' : 'false'}>
        <PlayerScore player={playerB} startedLeg={starter === playerB.id} />
      </div>
    </>
  );
}

describe('PlayerScore leg starter marker', () => {
  test('renders the dart icon only in the current leg starter legs section', () => {
    renderPlayers({ leg: 1, firstPlayer: 'pA', activePlayer: 'pB' });

    expect(screen.getAllByTestId('leg-starter-icon')).toHaveLength(1);
    expect(screen.getByLabelText('Player A started this leg, 0 legs won')).not.toBeNull();
    expect(screen.getByTestId('player-b').querySelector('[data-testid="leg-starter-icon"]')).toBeNull();
  });

  test('persists across turns within the same leg and stays separate from active state', () => {
    const { rerender } = renderPlayers({ leg: 1, firstPlayer: 'pA', activePlayer: 'pA' });

    expect(screen.getByLabelText('Player A started this leg, 0 legs won')).not.toBeNull();
    expect(screen.getByTestId('player-a').getAttribute('data-active')).toBe('true');

    const playerA = makePlayer('pA', 'Player A', false);
    const playerB = makePlayer('pB', 'Player B', true);
    rerender(
      <>
        <div data-testid="player-a" data-active="false">
          <PlayerScore player={playerA} startedLeg />
        </div>
        <div data-testid="player-b" data-active="true">
          <PlayerScore player={playerB} />
        </div>
      </>
    );

    expect(screen.getAllByTestId('leg-starter-icon')).toHaveLength(1);
    expect(screen.getByLabelText('Player A started this leg, 0 legs won')).not.toBeNull();
    expect(screen.getByTestId('player-b').getAttribute('data-active')).toBe('true');
  });

  test('changes starter when the next leg starts', () => {
    const { rerender } = renderPlayers({ leg: 1, firstPlayer: 'pA', activePlayer: 'pA' });

    expect(screen.getByLabelText('Player A started this leg, 0 legs won')).not.toBeNull();

    const playerA = makePlayer('pA', 'Player A', false);
    const playerB = makePlayer('pB', 'Player B', true);
    rerender(
      <>
        <div data-testid="player-a" data-active="false">
          <PlayerScore player={playerA} />
        </div>
        <div data-testid="player-b" data-active="true">
          <PlayerScore player={playerB} startedLeg />
        </div>
      </>
    );

    expect(screen.getAllByTestId('leg-starter-icon')).toHaveLength(1);
    expect(screen.getByLabelText('Player B started this leg, 0 legs won')).not.toBeNull();
  });
});
