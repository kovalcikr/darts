import { expect, test } from '@playwright/test';

test.describe('scoreboard UI', () => {
  test('renders the local test match details', async ({ page }) => {
    await page.goto('/test');

    await expect(page.getByText('ABC')).toBeVisible();
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

  test('updates and clears the entered score without submitting', async ({ page }) => {
    await page.goto('/test');

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
