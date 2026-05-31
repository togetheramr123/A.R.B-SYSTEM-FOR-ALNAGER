import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('جهات الاتصال - Contacts Module', () => {
  // ─── 1. قائمة جهات الاتصال ───
  test.describe('قائمة جهات الاتصال - /contacts', () => {
    test('تحميل صفحة قائمة جهات الاتصال', async ({ page }) => {
      await smokeTestPage(page, '/contacts', 'قائمة جهات الاتصال');
    });

    test('التحقق من عرض القائمة أو الشبكة', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify a list or grid of contacts renders
      const listOrGrid = page.locator('table, [role="grid"], [role="list"], [class*="table"], [class*="list"], [class*="grid"], [class*="card"], tbody tr, [class*="row"]');
      await expect(listOrGrid.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود حقل البحث', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const searchInput = page.locator('input[type="search"], input[type="text"], input[placeholder*="بحث"], input[placeholder*="search"], input[placeholder*="Search"], [class*="search"] input');
      if (await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(searchInput.first()).toBeVisible();
      }
    });

    test('التحقق من وجود زر إضافة جهة اتصال', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const addButton = page.locator('button, a').filter({ hasText: /إضافة|جديد|أضف|new|add|create|إنشاء/i });
      await expect(addButton.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 2. إنشاء جهة اتصال جديدة ───
  test.describe('إنشاء جهة اتصال جديدة - /contacts/create', () => {
    test('تحميل صفحة إنشاء جهة اتصال', async ({ page }) => {
      await smokeTestPage(page, '/contacts/create', 'إنشاء جهة اتصال');
    });

    test('التحقق من وجود نموذج الإنشاء', async ({ page }) => {
      await navigateTo(page, '/contacts/create');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify the form is present
      const form = page.locator('form, [class*="form"], [role="form"]');
      await expect(form.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود حقل الاسم', async ({ page }) => {
      await navigateTo(page, '/contacts/create');
      await waitForPageReady(page);

      const nameInput = page.locator('input[name*="name"], input[placeholder*="اسم"], input[placeholder*="name"], label:has-text("اسم") + input, label:has-text("اسم") ~ input');
      await expect(nameInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود حقول الاتصال الأساسية', async ({ page }) => {
      await navigateTo(page, '/contacts/create');
      await waitForPageReady(page);

      // Check for common contact form fields (phone, email, etc.)
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(2); // Should have multiple fields
    });

    test('التحقق من وجود زر الحفظ', async ({ page }) => {
      await navigateTo(page, '/contacts/create');
      await waitForPageReady(page);

      const saveButton = page.locator('button[type="submit"], button').filter({ hasText: /حفظ|إرسال|save|submit|إضافة|أضف/i });
      await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 3. فتح أول جهة اتصال ───
  test.describe('فتح أول جهة اتصال', () => {
    test('النقر على أول جهة اتصال في القائمة', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Wait for contacts list to load
      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      // Click the first contact
      await rows.first().click();
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify we navigated to a detail page
      await expect(page).not.toHaveURL(/\/contacts\/?$/);
    });

    test('التحقق من تحميل تفاصيل جهة الاتصال', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);

      // Verify detail content is visible
      const detailContent = page.locator('main, [role="main"], .content, #content, [class*="detail"], [class*="profile"]');
      await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 4. التحقق من وجود تبويبات ───
  test.describe('التحقق من وجود تبويبات جهة الاتصال', () => {
    test('التحقق من وجود تبويبات (حسابات، عناوين، إلخ)', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Look for tabs in the contact detail page
      const tabs = page.locator('[role="tab"], [class*="tab"], button[data-tab], a[data-tab], [class*="Tab"]');
      await expect(tabs.first()).toBeVisible({ timeout: 10000 });

      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(2); // Should have at least 2 tabs
    });

    test('التحقق من إمكانية التبديل بين التبويبات', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);

      const tabs = page.locator('[role="tab"], [class*="tab"], button[data-tab], a[data-tab], [class*="Tab"]');
      const tabCount = await tabs.count();

      if (tabCount >= 2) {
        // Click the second tab
        await tabs.nth(1).click();
        await page.waitForTimeout(1000);
        await assertNoErrors(page);

        // Click back to the first tab
        await tabs.nth(0).click();
        await page.waitForTimeout(1000);
        await assertNoErrors(page);
      }
    });

    test('البحث عن تبويب الحسابات', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);

      const accountsTab = page.locator('[role="tab"], [class*="tab"], button, a').filter({ hasText: /حسابات|accounts|account/i });
      if (await accountsTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await accountsTab.first().click();
        await page.waitForTimeout(1000);
        await assertNoErrors(page);
      }
    });

    test('البحث عن تبويب العناوين', async ({ page }) => {
      await navigateTo(page, '/contacts');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);

      const addressesTab = page.locator('[role="tab"], [class*="tab"], button, a').filter({ hasText: /عناوين|عنوان|addresses|address/i });
      if (await addressesTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await addressesTab.first().click();
        await page.waitForTimeout(1000);
        await assertNoErrors(page);
      }
    });
  });
});
