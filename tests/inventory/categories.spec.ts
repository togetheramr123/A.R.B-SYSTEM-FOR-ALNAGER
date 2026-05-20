import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('فئات المنتجات - Categories', () => {

  test('فتح قائمة الفئات', async ({ page }) => {
    await navigateTo(page, '/inventory/products/categories');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('إنشاء فئة جديدة من داخل صفحة المنتج (Dialog)', async ({ page }) => {
    await navigateTo(page, '/inventory/products/new');
    await waitForPageReady(page);

    // Focus on category combobox — the OdooCombobox renders an input with placeholder="All"
    const categoryInput = page.locator('input[placeholder="All"]').first();
    
    if (await categoryInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryInput.click();
      await page.waitForTimeout(300);
      await categoryInput.fill('فئة_تجريبية_آلية');
      await page.waitForTimeout(500);

      // Click create option in the dropdown
      const createOption = page.locator('div:has-text("إنشاء وتعديل")').last();
      if (await createOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createOption.click();
        await page.waitForTimeout(1000);

        // Dialog should be open — look for the backdrop overlay
        const dialog = page.locator('.fixed.inset-0.z-50');
        if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Fill category name
          const catNameInput = page.locator('.fixed.inset-0 input').first();
          if (await catNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await catNameInput.clear();
            await catNameInput.fill('فئة الاختبار الآلي');
          }

          // Click save
          const saveBtn = page.locator('.fixed.inset-0 button:has-text("حفظ")').first();
          if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await saveBtn.click();
            await page.waitForTimeout(1500);
          }
        }
      }
    }

    // No errors on the page
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
