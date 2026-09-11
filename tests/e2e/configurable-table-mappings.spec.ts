import { expect, test, type APIRequestContext } from '@playwright/test'

async function resetFakeCueScore(request: APIRequestContext, tournamentId: string) {
  const response = await request.post('/api/test/cuescore', { data: { tournamentId } })
  expect(response.ok()).toBeTruthy()
}

test('admin mapping changes flow through tables, stable URLs, and dashboard', async ({ page, request }, testInfo) => {
  const tournamentId = `mapping-flow-${testInfo.parallelIndex}-${Date.now()}`
  await resetFakeCueScore(request, tournamentId)

  await page.goto('/tournaments')
  await page.getByPlaceholder('Tournament ID').fill(tournamentId)
  await page.getByRole('button', { name: 'Otvoriť' }).click()
  await expect(page).toHaveURL(/\/tables$/)

  await page.goto('/admin')

  await page.getByLabel('Username').fill('admin')
  await page.getByLabel('Password').fill('admin')
  await page.getByRole('button', { name: 'Open Admin' }).click()
  await expect(page).toHaveURL(/\/admin\?notice=/)

  const slotInputs = page.locator('input[name^="slot-"]')
  const originalSlots = await Promise.all(
    Array.from({ length: await slotInputs.count() }, (_, index) => slotInputs.nth(index).inputValue()),
  )
  const removedSlot = originalSlots.at(-1)!

  await page.getByRole('button', { name: 'Remove' }).last().click()
  await page.locator('input[name^="name-"]').last().fill(`changed-${Date.now()}`)
  await page.getByRole('button', { name: 'Save Table Mappings' }).click()
  await expect(page).toHaveURL(/\/admin\?notice=/)
  await expect(page.getByText('Table Mappings saved.')).toBeVisible()

  await page.goto('/tables')
  for (const slot of originalSlots.slice(0, -1)) {
    await expect(page.getByRole('link', { name: `Table ${slot}` })).toBeVisible()
  }
  const tableLinks = await page
    .locator('a[href^="/tables/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(tableLinks).toEqual(originalSlots.slice(0, -1).map((slot) => `/tables/${slot}`))
  await expect(page.getByRole('link', { name: `Table ${removedSlot}` })).toHaveCount(0)

  await page.goto(`/tables/${removedSlot}`)
  await expect(page.getByText('Table removed')).toBeVisible()

  await page.goto('/dashboard')
  await expect(page.getByTestId(/^dashboard-table-/)).toHaveCount(originalSlots.length - 1)
})
