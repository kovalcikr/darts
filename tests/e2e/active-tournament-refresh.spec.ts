import { expect, test, type Page } from '@playwright/test'
import crypto from 'crypto'

async function ensureAdminSession(page: Page) {
  const sessionToken = crypto.createHash('sha256').update('admin\0admin').digest('hex')
  return page.context().addCookies([
    { name: 'darts-admin-session', value: sessionToken, domain: 'app', path: '/' },
  ])
}

async function clearActiveTournamentSetting(page: Page) {
  await ensureAdminSession(page)
  await page.goto('/admin')

  const clearButton = page.getByRole('button', { name: 'Clear Active' })
  if (await clearButton.isVisible()) {
    await clearButton.click()
    await page.waitForURL('/admin')
  }
}

test('empty active tournament views refresh after a tournament is activated', async ({
  browser,
  page,
  request,
}, testInfo) => {
  const tournamentId = `local-refresh-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting(page)

  const context = await browser.newContext()
  const tablesPage = await context.newPage()
  const dashboardPage = await context.newPage()

  await tablesPage.goto('/tables')
  await dashboardPage.goto('/dashboard')

  await expect(tablesPage.getByText('No active tournament for tables')).toBeVisible()
  await expect(dashboardPage.getByText('No active tournaments')).toBeVisible()

  const response = await request.post('/tournaments/open', {
    form: { tournamentId },
  })

  expect(response.status()).toBeLessThan(400)

  await expect(tablesPage.getByRole('link', { name: 'Table 1' })).toBeVisible({
    timeout: 10_000,
  })
  await expect(dashboardPage.getByText('#1')).toBeVisible({
    timeout: 10_000,
  })

  await context.close()
})

test('dashboard polling shows inactive state after the active tournament is cleared', async ({
  page,
  request,
}, testInfo) => {
  const tournamentId = `local-dashboard-clear-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting(page)

  const response = await request.post('/tournaments/open', {
    form: { tournamentId },
  })

  expect(response.status()).toBeLessThan(400)

  await page.goto('/dashboard')
  await expect(page.getByText('#1')).toBeVisible()

  await clearActiveTournamentSetting(page)
  await page.goto('/dashboard')

  await expect(page.getByText('No active tournaments')).toBeVisible({
    timeout: 10_000,
  })
  await expect(page.getByText('Error: Failed to fetch server data')).toHaveCount(0)
})
