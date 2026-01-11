import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Only one browser window at a time
  reporter: 'html',
  use: {
    baseURL: 'https://wandr.jon-c95.workers.dev',
    trace: 'on-first-retry',
    headless: false, // Show browser window
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
