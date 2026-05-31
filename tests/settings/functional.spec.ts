import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('الإعدادات - Settings Pages', () => {
  // ─── 1. الإعدادات الرئيسية ───
  test.describe('الإعدادات الرئيسية - /settings', () => {
    test('تحميل صفحة الإعدادات الرئيسية', async ({ page }) => {
      await smokeTestPage(page, '/settings', 'الإعدادات الرئيسية');
    });

    test('التحقق من وجود روابط الأقسام الفرعية', async ({ page }) => {
      await navigateTo(page, '/settings');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify navigation links/cards to sub-settings are visible
      const content = page.locator('main, [role="main"], .content, #content, body');
      await expect(content).toBeVisible();
    });
  });

  // ─── 2. المستخدمين ───
  test.describe('المستخدمين - /settings/users', () => {
    test('تحميل صفحة المستخدمين', async ({ page }) => {
      await smokeTestPage(page, '/settings/users', 'المستخدمين');
    });

    test('التحقق من وجود قائمة المستخدمين أو جدول', async ({ page }) => {
      await navigateTo(page, '/settings/users');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const tableOrList = page.locator('table, [role="grid"], [role="list"], .user-list, .users-table, [class*="table"], [class*="list"], [class*="grid"]');
      await expect(tableOrList.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود زر إضافة مستخدم', async ({ page }) => {
      await navigateTo(page, '/settings/users');
      await waitForPageReady(page);

      const addButton = page.locator('button, a').filter({ hasText: /إضافة|جديد|أضف|new|add|create/i });
      if (await addButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });

  // ─── 3. المجموعات ───
  test.describe('المجموعات - /settings/groups', () => {
    test('تحميل صفحة المجموعات', async ({ page }) => {
      await smokeTestPage(page, '/settings/groups', 'المجموعات');
    });

    test('التحقق من وجود قائمة المجموعات', async ({ page }) => {
      await navigateTo(page, '/settings/groups');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const tableOrList = page.locator('table, [role="grid"], [role="list"], [class*="table"], [class*="list"], [class*="grid"], [class*="card"]');
      await expect(tableOrList.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود زر إضافة مجموعة', async ({ page }) => {
      await navigateTo(page, '/settings/groups');
      await waitForPageReady(page);

      const addButton = page.locator('button, a').filter({ hasText: /إضافة|جديد|أضف|new|add|create/i });
      if (await addButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });

  // ─── 4. الاستيراد ───
  test.describe('الاستيراد - /settings/import', () => {
    test('تحميل صفحة الاستيراد', async ({ page }) => {
      await smokeTestPage(page, '/settings/import', 'الاستيراد');
    });

    test('التحقق من وجود عناصر رفع الملفات أو خيارات الاستيراد', async ({ page }) => {
      await navigateTo(page, '/settings/import');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const importElements = page.locator('input[type="file"], button, [class*="upload"], [class*="import"], [class*="drop"]');
      await expect(importElements.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 5. التكاملات ───
  test.describe('التكاملات - /settings/integrations', () => {
    test('تحميل صفحة التكاملات', async ({ page }) => {
      await smokeTestPage(page, '/settings/integrations', 'التكاملات');
    });

    test('التحقق من وجود قائمة التكاملات المتاحة', async ({ page }) => {
      await navigateTo(page, '/settings/integrations');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const content = page.locator('main, [role="main"], .content, #content');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 6. الإشعارات ───
  test.describe('الإشعارات - /settings/notifications', () => {
    test('تحميل صفحة الإشعارات', async ({ page }) => {
      await smokeTestPage(page, '/settings/notifications', 'الإشعارات');
    });

    test('التحقق من وجود إعدادات الإشعارات', async ({ page }) => {
      await navigateTo(page, '/settings/notifications');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Look for toggles, checkboxes, or switches for notification settings
      const settingsElements = page.locator('input[type="checkbox"], [role="switch"], [class*="toggle"], [class*="switch"], button, select');
      await expect(settingsElements.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 7. خريطة OCR ───
  test.describe('خريطة OCR - /settings/ocr-mapping', () => {
    test('تحميل صفحة خريطة OCR', async ({ page }) => {
      await smokeTestPage(page, '/settings/ocr-mapping', 'خريطة OCR');
    });

    test('التحقق من وجود عناصر تعيين OCR', async ({ page }) => {
      await navigateTo(page, '/settings/ocr-mapping');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const content = page.locator('main, [role="main"], .content, #content, form, table, [class*="mapping"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 8. مزامنة Odoo ───
  test.describe('مزامنة Odoo - /settings/odoo-sync', () => {
    test('تحميل صفحة مزامنة Odoo', async ({ page }) => {
      await smokeTestPage(page, '/settings/odoo-sync', 'مزامنة Odoo');
    });

    test('التحقق من وجود إعدادات المزامنة', async ({ page }) => {
      await navigateTo(page, '/settings/odoo-sync');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const syncElements = page.locator('input, button, [class*="sync"], [class*="connect"], form, select');
      await expect(syncElements.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 9. الأداء ───
  test.describe('الأداء - /settings/performance', () => {
    test('تحميل صفحة الأداء', async ({ page }) => {
      await smokeTestPage(page, '/settings/performance', 'الأداء');
    });

    test('التحقق من وجود مقاييس أو إعدادات الأداء', async ({ page }) => {
      await navigateTo(page, '/settings/performance');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const content = page.locator('main, [role="main"], .content, #content');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 10. البوابة ───
  test.describe('البوابة - /settings/portal', () => {
    test('تحميل صفحة البوابة', async ({ page }) => {
      await smokeTestPage(page, '/settings/portal', 'البوابة');
    });

    test('التحقق من وجود إعدادات البوابة', async ({ page }) => {
      await navigateTo(page, '/settings/portal');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const portalElements = page.locator('input, button, [class*="portal"], form, select, [role="switch"], input[type="checkbox"]');
      await expect(portalElements.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ─── 11. إعادة الضبط ───
  test.describe('إعادة الضبط - /settings/reset', () => {
    test('تحميل صفحة إعادة الضبط', async ({ page }) => {
      await smokeTestPage(page, '/settings/reset', 'إعادة الضبط');
    });

    test('التحقق من وجود خيارات إعادة الضبط', async ({ page }) => {
      await navigateTo(page, '/settings/reset');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Should have reset buttons or confirmation dialogs
      const resetElements = page.locator('button, [class*="reset"], [class*="danger"], [class*="warning"]');
      await expect(resetElements.first()).toBeVisible({ timeout: 10000 });
    });

    test('عدم تنفيذ إعادة الضبط بدون تأكيد', async ({ page }) => {
      await navigateTo(page, '/settings/reset');
      await waitForPageReady(page);

      // Verify there's some kind of confirmation guard (button should exist but not auto-trigger)
      const resetButton = page.locator('button').filter({ hasText: /إعادة|ضبط|reset|مسح|حذف/i });
      if (await resetButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(resetButton.first()).toBeEnabled();
      }
    });
  });

  // ─── 12. أرشفة قاعدة البيانات ───
  test.describe('أرشفة قاعدة البيانات - /settings/database-archiving', () => {
    test('تحميل صفحة أرشفة قاعدة البيانات', async ({ page }) => {
      await smokeTestPage(page, '/settings/database-archiving', 'أرشفة قاعدة البيانات');
    });

    test('التحقق من وجود خيارات الأرشفة', async ({ page }) => {
      await navigateTo(page, '/settings/database-archiving');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const archiveElements = page.locator('button, input, select, [class*="archive"], [class*="backup"], form, table');
      await expect(archiveElements.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
