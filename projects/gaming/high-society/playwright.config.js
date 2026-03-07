// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 1,
  workers: 1,        // serial — Firebase game state must be predictable
  reporter: 'list',
  use: {
    headless: true,
    baseURL: 'https://ngnnah.github.io/I-And-AI/projects/gaming/high-society/',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
