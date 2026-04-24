import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3002';
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? '/usr/bin/chromium-browser';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'off',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: chromiumExecutablePath,
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      name: 'chromium-e2e',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev:playwright:e2e',
    url: `${baseURL}/tournaments`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
