import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function openStartedTableOne(page: Page, testInfo: TestInfo) {
  const tournamentId = `ui-scoreboard-${testInfo.project.name}-${testInfo.parallelIndex}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await page.goto('/tournaments');
  await page.getByPlaceholder('Tournament ID').fill(tournamentId);
  await page.getByRole('button', { name: 'Otvoriť' }).click();

  await expect(page).toHaveURL(/\/tables$/);
  await page.getByRole('link', { name: 'Table 1' }).click();
  await expect(page).toHaveURL(/\/tables\/1$/);
  await expect(page.getByText('First to play:')).toBeVisible();
  
  // Wait for form submission and redirect
  await page.locator('[data-testid^="start-player-"]').first().click();
  
  // Wait for the scoreboard to appear (indicates successful navigation)
  await expect(page.getByRole('button', { name: 'UNDO' })).toBeVisible({ timeout: 15000 });
}

test.describe('scoreboard UI', () => {
  test('renders the active tournament table match details', async ({ page }, testInfo) => {
    await openStartedTableOne(page, testInfo);

    await expect(page.getByText(/Local Tournament ui-scoreboard-/)).toBeVisible();
    await expect(page.getByText('Round 1')).toBeVisible();
    await expect(page.getByText('First to 3 legs')).toBeVisible();
    await expect(page.getByText('Fero Hruska')).toBeVisible();
    await expect(page.getByText('Jozo Mrkva')).toBeVisible();
    await expect(page.getByRole('button', { name: 'UNDO' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'UNDO' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'REDO' })).toBeDisabled();
    await expect(page.getByTestId('scoreboard-backspace')).toBeEnabled();
    await expect(page.getByRole('button', { name: '1' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'CLR' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'OK' })).toBeEnabled();
    await expect(page.getByTestId('scoreboard-throw-history')).toBeVisible();
    await expect(page.getByTestId('scoreboard-input')).toHaveText('0');
  });

  test('updates and clears the entered score without submitting', async ({ page }, testInfo) => {
    await openStartedTableOne(page, testInfo);

    const scoreInput = page.getByTestId('scoreboard-input');

    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '8' }).click();
    await page.getByRole('button', { name: '0' }).click();
    await expect(scoreInput).toHaveText('180');

    await page.getByRole('button', { name: '9' }).click();
    await expect(scoreInput).toHaveText('180');

    await page.getByRole('button', { name: 'CLR' }).click();
    await expect(scoreInput).toHaveText('0');

    await page.getByTestId('scoreboard-backspace').click();
    await expect(scoreInput).toHaveText('0');
  });
});
