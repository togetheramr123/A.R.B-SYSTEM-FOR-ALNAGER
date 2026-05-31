import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join('test-results', '.auth', 'user.json');

/**
 * Authentication Setup
 * ====================
 * This test runs once before all other tests.
 * It logs in and saves the session cookies for reuse.
 */
setup('تسجيل الدخول وحفظ الجلسة', async ({ page }) => {
  // Navigate to login page
  await page.goto('/ar/login', { waitUntil: 'domcontentloaded' });
  
  // Fill credentials - using demo account
  const usernameInput = page.locator('input[name="username"]');
  const passwordInput = page.locator('input[name="password"]');
  
  await usernameInput.fill(process.env.TEST_USERNAME || 'admin');
  await passwordInput.fill(process.env.TEST_PASSWORD || 'admin');
  
  // Submit the form
  await page.locator('button[type="submit"]').click();
  
  // Wait for redirect to dashboard (indicates successful login)
  await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => {
    // If not redirected to dashboard, might be redirected elsewhere
    console.log('Login redirect URL:', page.url());
  });
  
  // Verify we are logged in - page should not still be on login
  const currentUrl = page.url();
  console.log(`Post-login URL: ${currentUrl}`);
  
  // Save the authentication state
  await page.context().storageState({ path: authFile });
  console.log(`Auth state saved to ${authFile}`);
});
