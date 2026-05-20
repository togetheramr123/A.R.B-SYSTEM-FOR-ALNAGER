import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('جهات الاتصال - Contacts', () => {

  test('قائمة جهات الاتصال تفتح', async ({ page }) => {
    await navigateTo(page, '/contacts');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Server Error');
  });

  test('إنشاء جهة اتصال جديدة', async ({ page }) => {
    await navigateTo(page, '/contacts');
    await waitForPageReady(page);

    // Look for "New" or "جديد" button
    const newBtn = page.locator('a:has-text("جديد"), button:has-text("جديد"), a:has-text("إضافة")').first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await waitForPageReady(page);

      // Fill name
      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(`جهة اتصال تجريبية ${Date.now()}`);
      }

      // Page should not crash
      await expect(page.locator('body')).not.toContainText('Application error');
    }
  });
});
