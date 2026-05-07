import { expect, test, type APIRequestContext } from '@playwright/test'
import { Client } from 'pg'

const ACTIVE_TOURNAMENT_SETTING_KEY = 'activeTournamentId'

async function clearActiveTournamentSetting() {
  const connectionString = process.env.POSTGRES_PRISMA_URL

  const client = new Client({ connectionString })

  await client.connect()
  try {
    await client.query('delete from "AppSetting" where key = $1', [ACTIVE_TOURNAMENT_SETTING_KEY])
  } finally {
    await client.end()
  }
}

async function resetFakeCueScore(request: APIRequestContext, tournamentId: string) {
  const response = await request.post('/api/test/cuescore', {
    data: { tournamentId },
  })
  expect(response.ok()).toBeTruthy()
}

async function getFakeCueScoreSnapshot(request: APIRequestContext, tournamentId: string): Promise<any> {
  const response = await request.get(`/api/test/cuescore?tournamentId=${tournamentId}`)
  expect(response.ok()).toBeTruthy()
  return response.json()
}

test('dashboard cache revalidation shows new match after startMatch', async ({
  browser,
  page,
  request,
}, testInfo) => {
  const tournamentId = `cache-revalidate-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting()
  await resetFakeCueScore(request, tournamentId)

  // Open tournament
  await page.goto('/tournaments')
  await page.getByPlaceholder('Tournament ID').fill(tournamentId)
  await page.getByRole('button', { name: 'Otvoriť' }).click()

  await expect(page).toHaveURL(/\/tables$/)
  await expect(page.getByRole('link', { name: 'Table 1' })).toBeVisible({ timeout: 10_000 })

  // Create context with two pages - dashboard and table
  const context = await browser.newContext()
  const dashboardPage = await context.newPage()
  const tablePage = await context.newPage()

  // Open dashboard in first tab
  await dashboardPage.goto('/dashboard')

  // Initially should show no active tournament
  await expect(dashboardPage.getByText('No active tournaments')).toBeVisible({ timeout: 5000 })

  // Open table in second tab and start match
  await tablePage.goto('/tables/1')
  const snapshot = await getFakeCueScoreSnapshot(request, tournamentId)
  const match = snapshot.tournament?.matches.find((m: any) => m.table?.name === '11')
  const playerAId = String(match?.playerA?.playerId)

  // Start match
  await tablePage.getByTestId(`start-player-${playerAId}`).click()
  await expect(tablePage.getByRole('button', { name: 'UNDO' })).toBeVisible()

  // Dashboard should now show the match (cache revalidated via revalidateTag in startMatch)
  await expect(dashboardPage.getByText('#1')).toBeVisible({ timeout: 5000 })

  await context.close()
})

test('dashboard cache revalidation shows updated throw after addThrowAction', async ({
  browser,
  page,
  request,
}, testInfo) => {
  const tournamentId = `cache-throw-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting()
  await resetFakeCueScore(request, tournamentId)

  // Open tournament
  await page.goto('/tournaments')
  await page.getByPlaceholder('Tournament ID').fill(tournamentId)
  await page.getByRole('button', { name: 'Otvoriť' }).click()

  await expect(page).toHaveURL(/\/tables$/)
  await expect(page.getByRole('link', { name: 'Table 1' })).toBeVisible({ timeout: 10_000 })

  // Create context with two pages
  const context = await browser.newContext()
  const dashboardPage = await context.newPage()
  const tablePage = await context.newPage()

  // Open dashboard
  await dashboardPage.goto('/dashboard')

  // Open table and start match
  await tablePage.goto('/tables/1')
  const snapshot = await getFakeCueScoreSnapshot(request, tournamentId)
  const match = snapshot.tournament?.matches.find((m: any) => m.table?.name === '11')
  const playerAId = String(match?.playerA?.playerId)

  await tablePage.getByTestId(`start-player-${playerAId}`).click()
  await expect(tablePage.getByRole('button', { name: 'UNDO' })).toBeVisible()

  // Dashboard should show match
  await expect(dashboardPage.getByText('#1')).toBeVisible({ timeout: 5000 })

  // Enter a throw (this triggers cache revalidation via revalidateTag in addThrowAction)
  await tablePage.getByRole('button', { name: '1' }).click()
  await tablePage.getByRole('button', { name: '8' }).click()
  await tablePage.getByRole('button', { name: '0' }).click()
  await tablePage.getByRole('button', { name: 'OK' }).click()

  // Dashboard polls every second and should show updated state after cache invalidation
  await expect(dashboardPage.getByText('Score:')).toBeVisible({ timeout: 10_000 })

  await context.close()
})

test('dashboard cache revalidation shows restored state after undo', async ({
  browser,
  page,
  request,
}, testInfo) => {
  const tournamentId = `cache-undo-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting()
  await resetFakeCueScore(request, tournamentId)

  // Open tournament
  await page.goto('/tournaments')
  await page.getByPlaceholder('Tournament ID').fill(tournamentId)
  await page.getByRole('button', { name: 'Otvoriť' }).click()

  await expect(page).toHaveURL(/\/tables$/)
  await expect(page.getByRole('link', { name: 'Table 1' })).toBeVisible({ timeout: 10_000 })

  // Create context with two pages
  const context = await browser.newContext()
  const dashboardPage = await context.newPage()
  const tablePage = await context.newPage()

  // Open dashboard
  await dashboardPage.goto('/dashboard')

  // Open table and start match
  await tablePage.goto('/tables/1')
  const snapshot = await getFakeCueScoreSnapshot(request, tournamentId)
  const match = snapshot.tournament?.matches.find((m: any) => m.table?.name === '11')
  const playerAId = String(match?.playerA?.playerId)

  await tablePage.getByTestId(`start-player-${playerAId}`).click()
  await expect(tablePage.getByRole('button', { name: 'UNDO' })).toBeVisible()

  // Dashboard should show match
  await expect(dashboardPage.getByText('#1')).toBeVisible({ timeout: 5000 })

  // Enter a throw
  await tablePage.getByRole('button', { name: '1' }).click()
  await tablePage.getByRole('button', { name: '8' }).click()
  await tablePage.getByRole('button', { name: '0' }).click()
  await tablePage.getByRole('button', { name: 'OK' }).click()

  // Wait for dashboard to update
  await expect(dashboardPage.getByText('Score:')).toBeVisible({ timeout: 10_000 })

  // Undo the throw (triggers cache revalidation via revalidateTag in undoThrow)
  await tablePage.getByRole('button', { name: 'UNDO' }).click()

  // Dashboard should reflect the undo after cache revalidation
  await expect(dashboardPage.getByText('Score:')).toBeVisible({ timeout: 10_000 })

  await context.close()
})

test('dashboard cache invalidation is isolated between tables', async ({
  browser,
  page,
  request,
}, testInfo) => {
  const tournamentId = `cache-multi-${testInfo.parallelIndex}-${Date.now()}`

  await clearActiveTournamentSetting()
  await resetFakeCueScore(request, tournamentId)

  // Open tournament
  await page.goto('/tournaments')
  await page.getByPlaceholder('Tournament ID').fill(tournamentId)
  await page.getByRole('button', { name: 'Otvoriť' }).click()

  await expect(page).toHaveURL(/\/tables$/)
  await expect(page.getByRole('link', { name: 'Table 1' })).toBeVisible({ timeout: 10_000 })

  // Create context with dashboard and multiple table pages
  const context = await browser.newContext()
  const dashboardPage = await context.newPage()
  const table1Page = await context.newPage()
  const table2Page = await context.newPage()

  // Open dashboard
  await dashboardPage.goto('/dashboard')

  // Open both tables and start matches
  await table1Page.goto('/tables/1')
  await table2Page.goto('/tables/2')

  const snapshot = await getFakeCueScoreSnapshot(request, tournamentId)
  const match1 = snapshot.tournament?.matches.find((m: any) => m.table?.name === '11')
  const match2 = snapshot.tournament?.matches.find((m: any) => m.table?.name === '12')
  const player1Id = String(match1?.playerA?.playerId)
  const player2Id = String(match2?.playerA?.playerId)

  // Start match on table 1
  await table1Page.getByTestId(`start-player-${player1Id}`).click()
  await expect(table1Page.getByRole('button', { name: 'UNDO' })).toBeVisible()

  // Start match on table 2
  await table2Page.getByTestId(`start-player-${player2Id}`).click()
  await expect(table2Page.getByRole('button', { name: 'UNDO' })).toBeVisible()

  // Dashboard should show both matches
  await expect(dashboardPage.getByText('#1')).toBeVisible({ timeout: 5000 })
  await expect(dashboardPage.getByText('#2')).toBeVisible({ timeout: 5000 })

  // Enter throw on table 1 only
  await table1Page.getByRole('button', { name: '1' }).click()
  await table1Page.getByRole('button', { name: '8' }).click()
  await table1Page.getByRole('button', { name: '0' }).click()
  await table1Page.getByRole('button', { name: 'OK' }).click()

  // Dashboard should update for table 1 (cache tag match1 invalidated)
  await expect(dashboardPage.getByText('Score:')).toBeVisible({ timeout: 10_000 })

  // Table 2 should still be functional (cache tag match2 not invalidated)
  await expect(table2Page.getByRole('button', { name: 'UNDO' })).toBeEnabled()

  // Enter throw on table 2
  await table2Page.getByRole('button', { name: '6' }).click()
  await table2Page.getByRole('button', { name: '0' }).click()
  await table2Page.getByRole('button', { name: 'OK' }).click()

  // Dashboard should update for table 2 (cache tag match2 invalidated)
  await expect(dashboardPage.getByText('Score:')).toBeVisible({ timeout: 10_000 })

  // Table 1 should still be functional (different cache tag)
  await expect(table1Page.getByRole('button', { name: 'UNDO' })).toBeEnabled()

  await context.close()
})