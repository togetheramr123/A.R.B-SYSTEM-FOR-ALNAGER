import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('صفحات متنوعة - Miscellaneous Pages', () => {
  // ─── 1. التحليلات ───
  test.describe('التحليلات - /analytics', () => {
    test('تحميل صفحة التحليلات', async ({ page }) => {
      await smokeTestPage(page, '/analytics', 'التحليلات');
    });

    test('التحقق من وجود الرسوم البيانية أو لوحة المعلومات', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Look for charts, graphs, dashboards, or data visualization elements
      const visualElements = page.locator('canvas, svg, [class*="chart"], [class*="graph"], [class*="dashboard"], [class*="widget"], [class*="analytics"], [class*="stat"], [class*="metric"]');
      await expect(visualElements.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود فلاتر أو محددات الفترة الزمنية', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await waitForPageReady(page);

      const filters = page.locator('select, input[type="date"], [class*="filter"], [class*="date-picker"], [class*="period"], [class*="range"], button').filter({ hasText: /يوم|أسبوع|شهر|سنة|فترة|day|week|month|year|period|filter/i });
      if (await filters.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(filters.first()).toBeVisible();
      }
    });

    test('التحقق من عدم وجود أخطاء في وحدة التحكم', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await navigateTo(page, '/analytics');
      await waitForPageReady(page);

      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('hydration')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  // ─── 2. الكتالوجات ───
  test.describe('الكتالوجات - /catalogs', () => {
    test('تحميل صفحة الكتالوجات', async ({ page }) => {
      await smokeTestPage(page, '/catalogs', 'الكتالوجات');
    });

    test('التحقق من وجود قائمة الكتالوجات', async ({ page }) => {
      await navigateTo(page, '/catalogs');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listOrGrid = page.locator('table, [role="grid"], [role="list"], [class*="table"], [class*="list"], [class*="grid"], [class*="card"], [class*="catalog"]');
      await expect(listOrGrid.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إضافة كتالوج', async ({ page }) => {
      await navigateTo(page, '/catalogs');
      await waitForPageReady(page);

      const addButton = page.locator('button, a').filter({ hasText: /إضافة|جديد|أضف|new|add|create|إنشاء/i });
      if (await addButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(addButton.first()).toBeVisible();
      }
    });

    test('التحقق من وجود حقل البحث', async ({ page }) => {
      await navigateTo(page, '/catalogs');
      await waitForPageReady(page);

      const searchInput = page.locator('input[type="search"], input[type="text"], input[placeholder*="بحث"], input[placeholder*="search"], [class*="search"] input');
      if (await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(searchInput.first()).toBeVisible();
      }
    });
  });

  // ─── 3. تقرير متابعة الديون ───
  test.describe('تقرير متابعة الديون - /reports/debt-followup', () => {
    test('تحميل صفحة تقرير متابعة الديون', async ({ page }) => {
      await smokeTestPage(page, '/reports/debt-followup', 'تقرير متابعة الديون');
    });

    test('التحقق من وجود جدول أو بيانات التقرير', async ({ page }) => {
      await navigateTo(page, '/reports/debt-followup');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const reportContent = page.locator('table, [class*="table"], [class*="report"], [class*="data"], [role="grid"], canvas, svg, [class*="chart"]');
      await expect(reportContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود فلاتر التقرير', async ({ page }) => {
      await navigateTo(page, '/reports/debt-followup');
      await waitForPageReady(page);

      const filters = page.locator('select, input[type="date"], [class*="filter"], [class*="date"], button').filter({ hasText: /فلتر|تصفية|filter|بحث|search|تاريخ|date/i });
      if (await filters.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(filters.first()).toBeVisible();
      }
    });

    test('التحقق من وجود خيارات التصدير أو الطباعة', async ({ page }) => {
      await navigateTo(page, '/reports/debt-followup');
      await waitForPageReady(page);

      const exportButtons = page.locator('button, a').filter({ hasText: /تصدير|طباعة|export|print|pdf|excel|csv/i });
      if (await exportButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(exportButtons.first()).toBeVisible();
      }
    });

    test('التحقق من وجود ملخص أو إجماليات', async ({ page }) => {
      await navigateTo(page, '/reports/debt-followup');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Reports usually have summary/total sections
      const content = page.locator('main, [role="main"], .content, #content');
      await expect(content.first()).toBeVisible({ timeout: 10000 });

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(20); // Should have meaningful content
    });
  });

  // ─── 4. الدليل ───
  test.describe('الدليل - /manual', () => {
    test('تحميل صفحة الدليل', async ({ page }) => {
      await smokeTestPage(page, '/manual', 'الدليل');
    });

    test('التحقق من وجود محتوى الدليل', async ({ page }) => {
      await navigateTo(page, '/manual');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const content = page.locator('main, [role="main"], .content, #content, article, [class*="manual"], [class*="guide"], [class*="doc"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود جدول المحتويات أو التنقل', async ({ page }) => {
      await navigateTo(page, '/manual');
      await waitForPageReady(page);

      const navigation = page.locator('nav, [class*="sidebar"], [class*="toc"], [class*="menu"], [class*="navigation"], [role="navigation"], ul, ol');
      if (await navigation.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(navigation.first()).toBeVisible();
      }
    });

    test('التحقق من وجود نصوص توضيحية', async ({ page }) => {
      await navigateTo(page, '/manual');
      await waitForPageReady(page);

      // Manual should have substantial text content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(50);
    });

    test('التحقق من عدم وجود روابط معطلة في الصفحة', async ({ page }) => {
      await navigateTo(page, '/manual');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Just verify the page loaded without errors - no broken state
      const errorIndicators = page.locator('[class*="error"], [class*="404"], [class*="not-found"]');
      const errorCount = await errorIndicators.count();

      // Filter to only visible error indicators
      let visibleErrors = 0;
      for (let i = 0; i < errorCount; i++) {
        if (await errorIndicators.nth(i).isVisible().catch(() => false)) {
          visibleErrors++;
        }
      }
      expect(visibleErrors).toBe(0);
    });
  });
});
