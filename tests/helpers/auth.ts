import { Page, expect } from '@playwright/test';

/**
 * Navigate to a page with Arabic locale prefix
 */
export async function navigateTo(page: Page, path: string) {
  const url = path.startsWith('/ar') ? path : path.startsWith('/') ? `/ar${path}` : `/ar/${path}`;
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return response;
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Assert that a page loaded without critical errors.
 * This is the CORE assertion used in every smoke test.
 */
export async function assertNoErrors(page: Page, pageName: string) {
  const body = page.locator('body');
  
  // Check for Next.js / React error boundaries
  await expect(body, `${pageName}: Application error detected`).not.toContainText('Application error');
  await expect(body, `${pageName}: Server Error detected`).not.toContainText('Server Error');
  await expect(body, `${pageName}: 500 Internal Server Error`).not.toContainText('Internal Server Error');
  
  // Check for unhandled errors in the HTML
  await expect(body, `${pageName}: Unhandled Runtime Error`).not.toContainText('Unhandled Runtime Error');
  
  // Check for blank page
  const text = await body.textContent();
  expect(text && text.trim().length > 10, `${pageName}: Page appears blank`).toBeTruthy();
}

/**
 * Assert page loaded with a valid HTTP status (not 500)
 */
export async function assertValidStatus(response: any, pageName: string) {
  if (response) {
    const status = response.status();
    expect(status, `${pageName}: HTTP ${status}`).toBeLessThan(500);
  }
}

/**
 * Check for console errors on the page
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Full smoke test: navigate, wait, assert no errors, check status
 */
export async function smokeTestPage(page: Page, path: string, name: string) {
  const response = await navigateTo(page, path);
  await waitForPageReady(page);
  await assertValidStatus(response, name);
  await assertNoErrors(page, name);
}
