import { expect, test } from '@playwright/test';

test.describe('tournaments entry UI', () => {
  test('shows the tournament opening form', async ({ page }) => {
    await page.goto('/tournaments');

    await expect(
      page.getByRole('heading', { name: 'Zadajte ID turnaja' }),
    ).toBeVisible();
    await expect(page.getByPlaceholder('Tournament ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Otvoriť' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Domov' })).toBeVisible();
  });

  test('renders the inline error message from the query string', async ({ page }) => {
    await page.goto('/tournaments?error=Missing%20tournament%20ID');

    await expect(page.getByText('Missing tournament ID')).toBeVisible();
  });
});
