import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('المشتريات - Purchases', () => {

  test('قائمة أوامر الشراء تفتح', async ({ page }) => {
    await navigateTo(page, '/purchases');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Server Error');
  });

  test('إنشاء أمر شراء جديد', async ({ page }) => {
    await navigateTo(page, '/purchases/new');
    await waitForPageReady(page);

    await expect(page.locator('body')).not.toContainText('Application error');
    
    // Fill vendor/partner if available
    const vendorInput = page.locator('input[placeholder*="مورد"], input[placeholder*="شريك"]').first();
    if (await vendorInput.isVisible()) {
      await vendorInput.click();
      await page.waitForTimeout(300);
      // Select first option if dropdown appears
      const firstOption = page.locator('.absolute.z-50 div[class*="cursor-pointer"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Try to add a product line
    const addLineBtn = page.locator('button:has-text("إضافة"), button:has-text("إضافة بند"), a:has-text("إضافة بند")').first();
    if (await addLineBtn.isVisible()) {
      await addLineBtn.click();
      await page.waitForTimeout(500);
    }

    // Page should not crash
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
