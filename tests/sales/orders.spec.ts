import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('المبيعات - Sales', () => {

  test('قائمة أوامر البيع تفتح', async ({ page }) => {
    await navigateTo(page, '/sales');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Server Error');
  });

  test('إنشاء أمر بيع جديد', async ({ page }) => {
    await navigateTo(page, '/sales/new');
    await waitForPageReady(page);

    await expect(page.locator('body')).not.toContainText('Application error');

    // Fill customer if available
    const customerInput = page.locator('input[placeholder*="عميل"], input[placeholder*="شريك"]').first();
    if (await customerInput.isVisible()) {
      await customerInput.click();
      await page.waitForTimeout(300);
      const firstOption = page.locator('.absolute.z-50 div[class*="cursor-pointer"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Try to add a product line
    const addLineBtn = page.locator('button:has-text("إضافة"), button:has-text("إضافة بند")').first();
    if (await addLineBtn.isVisible()) {
      await addLineBtn.click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('قوائم الأسعار تفتح', async ({ page }) => {
    await navigateTo(page, '/sales/pricelists');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
