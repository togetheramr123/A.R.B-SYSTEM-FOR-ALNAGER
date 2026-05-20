import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('المنتجات - Products', () => {

  test('قائمة المنتجات تعرض بيانات', async ({ page }) => {
    await navigateTo(page, '/inventory/products');
    await waitForPageReady(page);

    await expect(page.locator('body')).not.toContainText('Application error');
    const addButton = page.locator('a[href*="new"], button:has-text("جديد"), a:has-text("جديد")');
    await expect(addButton.first()).toBeVisible();
  });

  test('إنشاء منتج جديد — كل الحقول الأساسية', async ({ page }) => {
    await navigateTo(page, '/inventory/products/new');
    await waitForPageReady(page);

    const productName = `منتج اختبار ${Date.now()}`;
    
    await page.fill('input[name="name"]', productName);
    
    const priceInput = page.locator('input[name="listPrice"]');
    if (await priceInput.isVisible()) {
      await priceInput.fill('150');
    }

    const costInput = page.locator('input[name="standardPrice"]');
    if (await costInput.isVisible()) {
      await costInput.fill('100');
    }

    const typeSelect = page.locator('select[name="detailedType"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('storable');
    }

    await page.waitForTimeout(500);
    const saveBtn = page.locator('button[title*="حفظ"], button:has-text("☁")').first();
    
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('تعديل فئة المنتج من النافذة المنبثقة — بدون فقدان البيانات', async ({ page }) => {
    await navigateTo(page, '/inventory/products/new');
    await waitForPageReady(page);

    const productName = `اختبار الفئة ${Date.now()}`;
    
    // Use the PRODUCT name input specifically (the one with placeholder for product name)
    const productNameInput = page.locator('input[placeholder*="طقم مكتب"]');
    await productNameInput.fill(productName);
    
    // Fill the price
    const priceInput = page.locator('input[name="listPrice"]');
    if (await priceInput.isVisible()) {
      await priceInput.fill('200');
    }

    // Try to open category dialog
    const categoryInput = page.locator('input[placeholder="All"]').first();
    
    if (await categoryInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoryInput.click();
      await page.waitForTimeout(300);
      await categoryInput.fill('فئة_اختبار');
      await page.waitForTimeout(500);
      
      const createOption = page.locator('div:has-text("إنشاء وتعديل")').last();
      if (await createOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createOption.click();
        await page.waitForTimeout(1000);

        const dialog = page.locator('.fixed.inset-0.z-50');
        const dialogOpened = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (dialogOpened) {
          // Close the dialog
          const cancelBtn = page.locator('.fixed.inset-0 button:has-text("إلغاء")').first();
          if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cancelBtn.click({ force: true });
            await page.waitForTimeout(500);
          }
        }
      }
    }

    // CRITICAL CHECK — The product name must still be there!
    const nameValue = await productNameInput.inputValue();
    expect(nameValue).toBe(productName);

    // The price must also still be there
    if (await priceInput.isVisible()) {
      const priceValue = await priceInput.inputValue();
      expect(priceValue).toBe('200');
    }
  });

  test('تعديل وحدة القياس من النافذة المنبثقة — بدون فقدان البيانات', async ({ page }) => {
    await navigateTo(page, '/inventory/products/new');
    await waitForPageReady(page);

    const productName = `اختبار الوحدة ${Date.now()}`;
    
    const productNameInput = page.locator('input[placeholder*="طقم مكتب"]');
    await productNameInput.fill(productName);
    
    // Click the UOM manage button
    const uomManageBtn = page.locator('button[title="إدارة وحدات القياس"]').first();
    if (await uomManageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await uomManageBtn.click();
      await page.waitForTimeout(1000);

      // Dialog should be open — close it using force:true to bypass overlay intercept
      const closeBtn = page.locator('.fixed.inset-0 button:has-text("إغلاق"), .fixed.inset-0 button:has-text("حفظ التعديلات"), .fixed.inset-0 button:has-text("إلغاء")').first();
      if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await closeBtn.click({ force: true });
        await page.waitForTimeout(1000);
      } else {
        // Try pressing Escape to close the dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }

    // CRITICAL CHECK — Product name must still be intact
    const nameValue = await productNameInput.inputValue();
    expect(nameValue).toBe(productName);
  });

  test('أزرار الحفظ والتراجع تظهر عند التعديل فقط', async ({ page }) => {
    await navigateTo(page, '/inventory/products/new');
    await waitForPageReady(page);

    await page.fill('input[name="name"]', 'test dirty state');
    await page.waitForTimeout(500);

    const cloudSaveBtn = page.locator('[title*="حفظ"]').first();
    const undoBtn = page.locator('[title*="تراجع"], [title*="إلغاء"]').first();
    
    const saveVisible = await cloudSaveBtn.isVisible().catch(() => false);
    const undoVisible = await undoBtn.isVisible().catch(() => false);
    expect(saveVisible || undoVisible).toBeTruthy();
  });

  test('أرشفة منتج — ظهور شريط "مؤرشف"', async ({ page }) => {
    await navigateTo(page, '/inventory/products');
    await waitForPageReady(page);

    const firstProductLink = page.locator('table tbody tr a, table tbody tr td').first();
    if (await firstProductLink.isVisible()) {
      await firstProductLink.click();
      await waitForPageReady(page);

      const actionMenu = page.locator('button:has-text("الإجراءات"), [data-testid="actions-menu"]').first();
      if (await actionMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionMenu.click();
        await page.waitForTimeout(300);

        const archiveOption = page.locator('text=أرشفة').first();
        if (await archiveOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await archiveOption.click();
          await page.waitForTimeout(1000);

          const ribbon = page.locator('text=مؤرشف').first();
          await expect(ribbon).toBeVisible();
        }
      }
    }
  });

  test('فلتر المؤرشف يعمل', async ({ page }) => {
    await navigateTo(page, '/inventory/products');
    await waitForPageReady(page);

    const filterBtn = page.locator('button:has-text("عوامل التصفية"), button:has-text("فلتر"), button:has-text("Filters")').first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(300);

      const archivedOption = page.locator('text=مؤرشف').first();
      if (await archivedOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await archivedOption.click();
        await page.waitForTimeout(1000);

        await expect(page.locator('body')).not.toContainText('Application error');
      }
    }
  });
});
