import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '3200';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // tests share one seeded database
  workers: 1,
  timeout: 120_000, // multi-session flows on slow CI runners
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Some sandboxes pre-install a Chromium that doesn't match the @playwright/test
    // pin; point at it explicitly instead of downloading a second browser.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
