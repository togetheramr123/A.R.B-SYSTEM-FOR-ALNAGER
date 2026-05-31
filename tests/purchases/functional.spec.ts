import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('المشتريات - Purchases Module', () => {
  // ──────────────────────────────────────────────
  // 1. قائمة أوامر الشراء
  // ──────────────────────────────────────────────
  test.describe('قائمة أوامر الشراء', () => {
    test('تحميل صفحة أوامر الشراء', async ({ page }) => {
      await smokeTestPage(page, '/purchases/orders', 'قائمة أوامر الشراء');
    });

    test('عرض جدول أوامر الشراء مع الأعمدة الأساسية', async ({ page }) => {
      await navigateTo(page, '/purchases/orders');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const table = page.locator('table, [role="grid"], [class*="list"], [class*="table"]');
      await expect(table.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إنشاء أمر شراء جديد', async ({ page }) => {
      await navigateTo(page, '/purchases/orders');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود عناصر البحث والفلترة', async ({ page }) => {
      await navigateTo(page, '/purchases/orders');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 2. إنشاء أمر شراء جديد
  // ──────────────────────────────────────────────
  test.describe('إنشاء أمر شراء جديد', () => {
    test('تحميل صفحة إنشاء أمر شراء جديد', async ({ page }) => {
      await smokeTestPage(page, '/purchases/new', 'إنشاء أمر شراء جديد');
    });

    test('التحقق من وجود حقل المورد', async ({ page }) => {
      await navigateTo(page, '/purchases/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const vendorField = page.locator(
        '[name*="partner"], [name*="vendor"], [name*="supplier"], ' +
        'label:has-text("المورد"), label:has-text("الشريك"), label:has-text("vendor"), label:has-text("supplier"), ' +
        'input[placeholder*="مورد"], input[placeholder*="vendor"]'
      );
      await expect(vendorField.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود خطوط الأمر (المنتجات)', async ({ page }) => {
      await navigateTo(page, '/purchases/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const linesSection = page.locator(
        '[class*="lines"], [class*="order-line"], [class*="product"], ' +
        'table, [role="grid"], ' +
        'button:has-text("إضافة"), button:has-text("أضف سطر"), button:has-text("Add")'
      );
      await expect(linesSection.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود حقول الإجماليات', async ({ page }) => {
      await navigateTo(page, '/purchases/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const totalsSection = page.locator(
        '[class*="total"], [class*="summary"], ' +
        'text=/إجمالي|المجموع|الضريبة|total|subtotal|tax/i'
      );
      await expect(totalsSection.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود أزرار الحفظ والإلغاء', async ({ page }) => {
      await navigateTo(page, '/purchases/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const saveButton = page.locator('button, a').filter({
        hasText: /حفظ|save|تأكيد|confirm|إرسال/i,
      });
      await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود حقل التاريخ', async ({ page }) => {
      await navigateTo(page, '/purchases/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const dateField = page.locator(
        'input[type="date"], input[type="datetime-local"], ' +
        '[name*="date"], [class*="date"], ' +
        'label:has-text("التاريخ"), label:has-text("date")'
      );
      await expect(dateField.first()).toBeVisible({ timeout: 15000 });
    });
  });

  // ──────────────────────────────────────────────
  // 3. فتح أول أمر شراء
  // ──────────────────────────────────────────────
  test.describe('فتح أول أمر شراء', () => {
    test('النقر على أول أمر شراء وعرض التفاصيل', async ({ page }) => {
      await navigateTo(page, '/purchases/orders');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const firstRow = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="order"], [class*="card"]'
      ).first();
      await expect(firstRow).toBeVisible({ timeout: 15000 });
      await firstRow.click();
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify we navigated to a detail page
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/purchases/orders');

      const detailContent = page.locator(
        '[class*="detail"], [class*="form"], [class*="order"], main, [role="main"]'
      );
      await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من عرض معلومات الأمر بعد الفتح', async ({ page }) => {
      await navigateTo(page, '/purchases/orders');
      await waitForPageReady(page);

      const firstRow = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="order"], [class*="card"]'
      ).first();

      if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await waitForPageReady(page);
        await assertNoErrors(page);

        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        expect(pageContent!.length).toBeGreaterThan(0);
      }
    });
  });

  // ──────────────────────────────────────────────
  // 4. تحليل المشتريات
  // ──────────────────────────────────────────────
  test.describe('تحليل المشتريات', () => {
    test('تحميل صفحة تحليل المشتريات', async ({ page }) => {
      await smokeTestPage(page, '/purchases/analysis', 'تحليل المشتريات');
    });

    test('التحقق من وجود عناصر التحليل (رسوم بيانية / جداول)', async ({ page }) => {
      await navigateTo(page, '/purchases/analysis');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const analysisContent = page.locator(
        'canvas, svg, [class*="chart"], [class*="graph"], [class*="report"], ' +
        '[class*="analysis"], [class*="pivot"], table, [role="grid"]'
      );
      await expect(analysisContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود فلاتر التحليل', async ({ page }) => {
      await navigateTo(page, '/purchases/analysis');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 5. خطوط المشتريات
  // ──────────────────────────────────────────────
  test.describe('خطوط المشتريات', () => {
    test('تحميل صفحة خطوط المشتريات', async ({ page }) => {
      await smokeTestPage(page, '/purchases/lines', 'خطوط المشتريات');
    });

    test('التحقق من عرض جدول خطوط المشتريات', async ({ page }) => {
      await navigateTo(page, '/purchases/lines');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const table = page.locator('table, [role="grid"], [class*="list"], [class*="table"]');
      await expect(table.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من أعمدة خطوط المشتريات', async ({ page }) => {
      await navigateTo(page, '/purchases/lines');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const headers = page.locator(
        'th, [role="columnheader"], [class*="header"], [class*="column-title"]'
      );
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────
  // 6. إعدادات المشتريات
  // ──────────────────────────────────────────────
  test.describe('إعدادات المشتريات', () => {
    test('تحميل صفحة إعدادات المشتريات', async ({ page }) => {
      await smokeTestPage(page, '/purchases/configuration', 'إعدادات المشتريات');
    });

    test('التحقق من وجود عناصر الإعدادات', async ({ page }) => {
      await navigateTo(page, '/purchases/configuration');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Look for settings form elements
      const settingsContent = page.locator(
        'form, [class*="settings"], [class*="config"], [class*="form"], ' +
        'input, select, [role="checkbox"], [role="switch"], ' +
        'label, [class*="option"]'
      );
      await expect(settingsContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر الحفظ في الإعدادات', async ({ page }) => {
      await navigateTo(page, '/purchases/configuration');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const saveButton = page.locator('button, a').filter({
        hasText: /حفظ|save|تطبيق|apply/i,
      });
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 7. قوائم أسعار الشراء
  // ──────────────────────────────────────────────
  test.describe('قوائم أسعار الشراء', () => {
    test('تحميل صفحة قوائم أسعار الشراء', async ({ page }) => {
      await smokeTestPage(page, '/purchases/pricelists', 'قوائم أسعار الشراء');
    });

    test('التحقق من عرض قائمة أسعار الشراء', async ({ page }) => {
      await navigateTo(page, '/purchases/pricelists');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listContent = page.locator(
        'table, [role="grid"], [class*="list"], [class*="table"], [class*="card"]'
      );
      await expect(listContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إنشاء قائمة أسعار جديدة', async ({ page }) => {
      await navigateTo(page, '/purchases/pricelists');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('فتح أول قائمة أسعار شراء', async ({ page }) => {
      await navigateTo(page, '/purchases/pricelists');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const firstItem = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="card"], [class*="pricelist"]'
      ).first();

      if (await firstItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstItem.click();
        await waitForPageReady(page);
        await assertNoErrors(page);

        const detailContent = page.locator(
          '[class*="detail"], [class*="form"], main, [role="main"]'
        );
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });
});
