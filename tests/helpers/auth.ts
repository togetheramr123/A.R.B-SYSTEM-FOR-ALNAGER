import { Page } from '@playwright/test';

/**
 * Helper: Navigate to a page with the Arabic locale prefix.
 * The middleware bypasses auth for non-login pages, so no login is needed.
 */
export async function navigateTo(page: Page, path: string) {
  const url = path.startsWith('/') ? `/ar${path}` : `/ar/${path}`;
  await page.goto(url, { waitUntil: 'networkidle' });
}

/**
 * Helper: Wait for page to be fully loaded (no spinners, content visible).
 */
export async function waitForPageReady(page: Page) {
  // Wait for any loading spinners to disappear
  await page.waitForLoadState('networkidle');
  // Small extra wait for React hydration
  await page.waitForTimeout(500);
}
