import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright Configuration for Smart ERP
 * =====================================================
 * Configured for:
 * - Arabic RTL layout testing
 * - Demo database testing (baseURL points to demo)
 * - Screenshot on failure for debugging
 * - HTML report generation
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/html-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  use: {
    // Local server URL to avoid Render sleep timeouts
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    locale: 'ar',
    // Viewport for consistent testing
    viewport: { width: 1440, height: 900 },
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'ar',
    },
  },
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    timeout: 120 * 1000, // 2 minutes for build and start
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_IS_DEMO: 'true',
    }
  },
  projects: [
    // Authentication setup - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main tests - depend on auth setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',
});
