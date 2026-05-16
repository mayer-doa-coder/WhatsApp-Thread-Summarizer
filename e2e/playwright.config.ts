import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  // Match only spec files — ignore config and helper files
  testMatch: '**/*.spec.ts',

  // 60 s per test: accounts for backend AI processing latency
  timeout: 60_000,
  expect: { timeout: 15_000 },

  // Retry once on CI to absorb transient LLM latency spikes
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    // Override with BASE_URL env var to target production: BASE_URL=https://your-app.vercel.app npm test
    // CRA dev server defaults to port 3000; change if your local setup differs
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

    // Capture traces on first retry for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
