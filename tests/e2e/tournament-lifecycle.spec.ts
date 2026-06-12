import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import crypto from 'crypto';

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

async function clearActiveTournament(page: Page) {
  const sessionToken = crypto
    .createHash('sha256')
    .update('admin\0admin')
    .digest('hex');
  await page.context().addCookies([
    { name: 'darts-admin-session', value: sessionToken, domain: 'app', path: '/' },
  ]);
  await page.goto('/admin');
  const clearButton = page.getByRole('button', { name: 'Clear Active' });
  if (await clearButton.isVisible()) {
    await clearButton.click();
    await page.waitForURL('/admin');
  }
}

async function resetFakeCueScore(request: APIRequestContext, tournamentId: string) {
  const response = await request.post('/api/test/cuescore', { data: { tournamentId } });
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
    await page.waitForTimeout(250);
    await page.goto('/tables/1');
    await waitForActivePlayer(page, nextActivePlayerId);
  }
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

test('full tournament lifecycle: empty → open → play → finish → close', async ({
  page,
  request,
  browser,
}, testInfo) => {
  const tournamentId = `local-lifecycle-${testInfo.parallelIndex}-${Date.now()}`;

  // ── Step 0: No open tournament → dashboard and scoreboards are waiting ──
  await clearActiveTournament(page);

  const tablesPage = await browser.newPage();
  const dashboardPage = await browser.newPage();

  await tablesPage.goto('/tables');
  await dashboardPage.goto('/dashboard');

  await expect(tablesPage.getByText('No active tournament for tables')).toBeVisible({
    timeout: 10_000,
  });
  await expect(dashboardPage.getByText('No active tournaments')).toBeVisible({
    timeout: 10_000,
  });

  await tablesPage.close();
  await dashboardPage.close();

  // ── Step 1: Admin opens new tournament ──
  await resetFakeCueScore(request, tournamentId);

  await page.goto('/tournaments');
  await page.getByPlaceholder('Tournament ID').fill(tournamentId);
  await page.getByRole('button', { name: 'Otvoriť' }).click();

  await expect(page).toHaveURL(/\/tables$/);

  // Wait for all 6 matches to be available in the fake provider
  await expect
    .poll(async () => {
      const snapshot = await getFakeCueScoreSnapshot(request, tournamentId);
      return snapshot.tournament?.matches.length ?? 0;
    })
    .toBe(6);

  // ── Step 2: New matches are visible on dashboard ──
  await page.goto('/dashboard');
  for (let i = 1; i <= 6; i++) {
    await expect(page.getByTestId(`dashboard-table-${i}`)).toBeVisible({
      timeout: 10_000,
    });
  }

  // ── Step 3: Matches are visible on scoreboard ──
  await page.goto('/tables/1');
  await expect(page.getByText('First to play:')).toBeVisible();

  // Get player IDs from the fake provider
  const openedSnapshot = await getFakeCueScoreSnapshot(request, tournamentId);
  const openedMatch = getTableMatch(openedSnapshot, '11');
  const playerAId = String(openedMatch.playerA.playerId);
  const playerBId = String(openedMatch.playerB.playerId);

  // Start the match — select a starter
  await page.getByTestId(`start-player-${playerAId}`).click();

  // Wait for the match to be ready (UNDO button appears)
  await expect(async () => {
    await page.goto('/tables/1');
    await expect(page.getByRole('button', { name: 'UNDO' })).toBeVisible();
  }).toPass({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'UNDO' })).toBeEnabled();

  // ── Step 4: Play a match → after leg CueScore updated, after match winner shown ──
  // Also verify live dashboard mid-match
  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-table-1')).toBeVisible();

  await page.goto('/tables/1');
  await waitForActivePlayer(page, playerAId);

  // Leg 1: Player A wins (180, 0, 180, 0, 141 checkout)
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 141, playerBId, true);

  // Verify CueScore updated after leg 1
  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 1,
    scoreB: 0,
    matchstatus: 'playing',
  });

  // Leg 2: Player A wins again
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

  // Leg 3: Player A wins (match over)
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 180, playerBId);
  await playTurn(page, 0, playerAId);
  await playTurn(page, 141, null, true);

  // Verify winner is shown on the scoreboard
  await expect(page.getByText('Winner:')).toBeVisible();
  await expect(page.getByText(openedMatch.playerA.name)).toBeVisible();

  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 3,
    scoreB: 0,
    matchstatus: 'playing',
  });

  // ── Step 5: Finish match → scoreboard waits, dashboard shows winner ──
  await page.getByRole('button', { name: 'Finish Match' }).click();

  await waitForMockMatchState(request, tournamentId, '11', {
    scoreA: 3,
    scoreB: 0,
    matchstatus: 'finished',
  });

  // Verify CueScore received the correct event sequence
  const snapshotAfterFinish = await getFakeCueScoreSnapshot(request, tournamentId);
  const eventSummary = snapshotAfterFinish.events.map(
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

  // Scoreboard shows "Waiting for match to start..."
  await page.goto('/tables/1');
  await expect(page.getByText('Waiting for match to start...')).toBeVisible();

  // Dashboard table card is empty (no VS/players) when match has finished
  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-table-1')).toBeVisible();
  await expect(page.getByTestId('dashboard-table-1')).not.toContainText('VS');
  await expect(page.getByTestId('dashboard-table-1')).not.toContainText(
    openedMatch.playerA.name,
  );

  // ── Step 6: Admin closes tournament → scoreboards/dashboard show no tournament ──
  await clearActiveTournament(page);

  // Tables page shows "no tournament"
  await page.goto('/tables');
  await expect(page.getByText('No active tournament for tables')).toBeVisible({
    timeout: 10_000,
  });

  // Table detail shows "no tournament"
  await page.goto('/tables/1');
  await expect(page.getByText('No active tournament for this table')).toBeVisible({
    timeout: 10_000,
  });

  // Dashboard shows "no tournament"
  await page.goto('/dashboard');
  await expect(page.getByText('No active tournaments')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Error: Failed to fetch server data')).toHaveCount(0);
});
