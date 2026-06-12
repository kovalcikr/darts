import { resolveChromiumExecutablePath } from './playwright.browser-path';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://app:3000';
const chromiumExecutablePath = resolveChromiumExecutablePath();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
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
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
});
