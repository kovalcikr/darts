import { expect, test } from '@playwright/test'
import { Client } from 'pg'

const ACTIVE_TOURNAMENT_SETTING_KEY = 'activeTournamentId'

async function clearActiveTournamentSetting() {
  const connectionString = process.env.POSTGRES_PRISMA_URL

  expect(connectionString, 'POSTGRES_PRISMA_URL must be set for E2E tests').toBeTruthy()

  const client = new Client({ connectionString })

  await client.connect()
  try {
    await client.query('delete from "AppSetting" where key = $1', [ACTIVE_TOURNAMENT_SETTING_KEY])
  } finally {
    await client.end()
  }
}

test('empty active tournament views refresh after a tournament is activated', async ({
  browser,
  request,
}, testInfo) => {
  const tournamentId = `local-refresh-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting()

  const context = await browser.newContext()
  const tablesPage = await context.newPage()
  const dashboardPage = await context.newPage()

  await tablesPage.goto('/tables')
  await dashboardPage.goto('/dashboard')

  await expect(tablesPage.getByText('No active tournament for tables')).toBeVisible()
  await expect(dashboardPage.getByText('No active tournament for dashboard')).toBeVisible()

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
