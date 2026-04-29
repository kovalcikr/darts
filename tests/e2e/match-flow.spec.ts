import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

type MockEvent = {
  type: 'updateMatchScore' | 'finishMatch';
  tournamentId: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
};

type MockMatch = {
  matchId: string | number;
  table?: { name: string };
  playerA: { playerId: string | number; name: string };
  playerB: { playerId: string | number; name: string };
  scoreA?: number;
  scoreB?: number;
  matchstatus: 'scheduled' | 'playing' | 'finished';
};

type MockSnapshot = {
  tournament: {
    tournamentId: string | number;
    matches: MockMatch[];
  } | null;
  events: MockEvent[];
};

async function resetFakeCueScore(request: APIRequestContext, tournamentId: string) {
  const response = await request.post('/api/test/cuescore', {
    data: { tournamentId },
  });
  expect(response.ok()).toBeTruthy();
}

async function getFakeCueScoreSnapshot(
  request: APIRequestContext,
  tournamentId: string,
): Promise<MockSnapshot> {
  const response = await request.get(`/api/test/cuescore?tournamentId=${tournamentId}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as MockSnapshot;
}

function getTableMatch(snapshot: MockSnapshot, tableName: string) {
  const match = snapshot.tournament?.matches.find(
    (candidate) => candidate.table?.name === tableName,
  );

  expect(match).toBeTruthy();
  return match!;
}

async function waitForActivePlayer(page: Page, playerId: string) {
  await expect(page.getByTestId(`player-card-${playerId}`)).toHaveAttribute(
    'data-active',
    'true',
  );
}

async function enterScore(page: Page, score: number, checkout = false) {
  const scoreInput = page.getByTestId('scoreboard-input');

  await expect(scoreInput).toHaveText('0');

  if (score !== 0) {
    for (const digit of String(score)) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
  }

  await page.getByRole('button', { name: 'OK', exact: true }).click();

  if (checkout) {
    await expect(page.getByText('Darts used:')).toBeVisible();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    return;
  }

  await expect(scoreInput).toHaveText('0');
}

async function playTurn(
  page: Page,
  score: number,
  nextActivePlayerId: string | null,
  checkout = false,
) {
  await enterScore(page, score, checkout);

  if (nextActivePlayerId) {
    await waitForActivePlayer(page, nextActivePlayerId);
  }
}

async function expectPlayerScore(page: Page, playerId: string, expectedScore: number) {
  await expect(page.getByTestId(`player-score-${playerId}`)).toHaveText(String(expectedScore));
}

async function waitForMockMatchState(
  request: APIRequestContext,
  tournamentId: string,
  tableName: string,
  expected: { scoreA: number; scoreB: number; matchstatus: string },
) {
  await expect
    .poll(async () => {
      const snapshot = await getFakeCueScoreSnapshot(request, tournamentId);
      const match = snapshot.tournament?.matches.find(
        (candidate) => candidate.table?.name === tableName,
      );

      return match
        ? `${match.scoreA ?? 0}-${match.scoreB ?? 0}-${match.matchstatus}`
        : 'missing';
    })
    .toBe(`${expected.scoreA}-${expected.scoreB}-${expected.matchstatus}`);
}

test('opens a tournament, plays a match, and closes it against the CueScore mock', async ({
  page,
  request,
}, testInfo) => {
  const tournamentId = `local-e2e-${testInfo.parallelIndex}-${Date.now()}`;

  await resetFakeCueScore(request, tournamentId);

  await page.goto('/tournaments');
  await page.getByPlaceholder('Tournament ID').fill(tournamentId);
  await page.getByRole('button', { name: 'Otvoriť' }).click();

  await expect(page).toHaveURL(/\/tables$/);

  await expect
    .poll(async () => {
      const snapshot = await getFakeCueScoreSnapshot(request, tournamentId);
      return snapshot.tournament?.matches.length ?? 0;
    })
    .toBe(6);

  const openedSnapshot = await getFakeCueScoreSnapshot(request, tournamentId);
  const openedMatch = getTableMatch(openedSnapshot, '11');
  const playerAId = String(openedMatch.playerA.playerId);
  const playerBId = String(openedMatch.playerB.playerId);

  await page.getByRole('link', { name: 'Table 1' }).click();
  await expect(page).toHaveURL(/\/tables\/11$/);
  await expect(page.getByText('First to play:')).toBeVisible();
  await page.getByTestId(`start-player-${playerAId}`).click();

  await expect(page.getByRole('button', { name: 'UNDO' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'UNDO' })).toBeEnabled();
  await expect(page.getByTestId('scoreboard-backspace')).toBeEnabled();
  await expect(page.getByRole('button', { name: '1' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'OK' })).toBeEnabled();
  await waitForActivePlayer(page, playerAId);

  await playTurn(page, 180, playerBId);
  await expectPlayerScore(page, playerAId, 321);
  await expectPlayerScore(page, playerBId, 501);

  await page.getByRole('button', { name: 'UNDO' }).click();
  await waitForActivePlayer(page, playerAId);
  await expectPlayerScore(page, playerAId, 501);
  await expectPlayerScore(page, playerBId, 501);
  await expect(page.getByTestId('scoreboard-throw-history')).toContainText('180');
  await expect(page.locator('[data-testid^="scoreboard-history-undone-"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'REDO' })).toBeEnabled();

  await page.getByRole('button', { name: 'REDO' }).click();
  await waitForActivePlayer(page, playerBId);
  await expectPlayerScore(page, playerAId, 321);
  await expectPlayerScore(page, playerBId, 501);

  await page.getByRole('button', { name: 'UNDO' }).click();
  await waitForActivePlayer(page, playerAId);
  await expectPlayerScore(page, playerAId, 501);
  await expectPlayerScore(page, playerBId, 501);

  await playTurn(page, 180, playerBId);
  await expect(page.getByRole('button', { name: 'REDO' })).toBeDisabled();
  await playTurn(page, 0, playerAId);
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 141, playerBId, true);

  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 1,
    scoreB: 0,
    matchstatus: 'playing',
  });

  await playTurn(page, 0, playerAId);
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 141, playerAId, true);

  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 2,
    scoreB: 0,
    matchstatus: 'playing',
  });

  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 141, null, true);

  await expect(page.getByText('Winner:')).toBeVisible();
  await expect(page.getByText(openedMatch.playerA.name)).toBeVisible();

  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 3,
    scoreB: 0,
    matchstatus: 'playing',
  });

  await page.getByRole('button', { name: 'Finish Match' }).click();

  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 3,
    scoreB: 0,
    matchstatus: 'finished',
  });

  const finalSnapshot = await getFakeCueScoreSnapshot(request, tournamentId);
  const eventSummary = finalSnapshot.events.map(
    (event) => `${event.type}:${event.scoreA}-${event.scoreB}`,
  );

  expect(eventSummary).toEqual(
    expect.arrayContaining([
      'updateMatchScore:1-0',
      'updateMatchScore:2-0',
      'updateMatchScore:3-0',
      'finishMatch:3-0',
    ]),
  );
  expect(eventSummary.at(-1)).toBe('finishMatch:3-0');

  await page.goto('/tables/11');
  await expect(page.getByText('Waiting for match to start...')).toBeVisible();
});
