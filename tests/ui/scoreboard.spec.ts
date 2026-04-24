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
    await expect(page.locator('input[disabled][value="0"]')).toBeVisible();
  });

  test('updates and clears the entered score without submitting', async ({ page }) => {
    await page.goto('/test');

    const scoreInput = page.locator('input[disabled]');

    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '8' }).click();
    await page.getByRole('button', { name: '0' }).click();
    await expect(scoreInput).toHaveValue('180');

    await page.getByRole('button', { name: '9' }).click();
    await expect(scoreInput).toHaveValue('180');

    await page.getByRole('button', { name: 'CLR' }).click();
    await expect(scoreInput).toHaveValue('0');
  });
});
