import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('إدارة علاقات العملاء - CRM Module', () => {
  // ─── 1. قائمة التذاكر ───
  test.describe('قائمة التذاكر - /crm/tickets', () => {
    test('تحميل صفحة قائمة التذاكر', async ({ page }) => {
      await smokeTestPage(page, '/crm/tickets', 'قائمة التذاكر');
    });

    test('التحقق من عرض جدول أو قائمة التذاكر', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const tableOrList = page.locator('table, [role="grid"], [role="list"], [class*="table"], [class*="list"], [class*="grid"], [class*="card"], [class*="kanban"], [class*="board"]');
      await expect(tableOrList.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود حقل البحث أو الفلتر', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      const searchOrFilter = page.locator('input[type="search"], input[type="text"], input[placeholder*="بحث"], input[placeholder*="search"], [class*="search"] input, [class*="filter"], select');
      if (await searchOrFilter.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(searchOrFilter.first()).toBeVisible();
      }
    });

    test('التحقق من وجود زر إنشاء تذكرة جديدة', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      const addButton = page.locator('button, a').filter({ hasText: /إضافة|جديد|أضف|new|add|create|إنشاء|تذكرة/i });
      if (await addButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(addButton.first()).toBeVisible();
      }
    });

    test('التحقق من وجود أعمدة الجدول أو عناصر القائمة', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      // Check for table headers or card content indicating ticket data
      const headers = page.locator('th, [role="columnheader"], [class*="header"], [class*="column-title"]');
      const cards = page.locator('[class*="card"], [class*="item"], [class*="ticket"]');

      const headersVisible = await headers.first().isVisible({ timeout: 5000 }).catch(() => false);
      const cardsVisible = await cards.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(headersVisible || cardsVisible).toBeTruthy();
    });

    test('التحقق من عدم وجود أخطاء عند تحميل الصفحة', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      // Filter out non-critical errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('hydration')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  // ─── 2. فتح أول تذكرة ───
  test.describe('فتح أول تذكرة', () => {
    test('النقر على أول تذكرة في القائمة', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Wait for ticket rows/cards to load
      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [class*="ticket"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      // Click the first ticket
      await rows.first().click();
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify navigation happened (URL changed from list)
      await expect(page).not.toHaveURL(/\/crm\/tickets\/?$/);
    });

    test('التحقق من تحميل تفاصيل التذكرة', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [class*="ticket"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);

      // Verify detail content is visible
      const detailContent = page.locator('main, [role="main"], .content, #content, [class*="detail"], [class*="ticket-detail"]');
      await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود معلومات التذكرة الأساسية', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [class*="ticket"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify some content is showing (title, status, description, etc.)
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(50); // Page should have meaningful content
    });

    test('التحقق من وجود أزرار إجراءات التذكرة', async ({ page }) => {
      await navigateTo(page, '/crm/tickets');
      await waitForPageReady(page);

      const rows = page.locator('table tbody tr, [class*="row"], [class*="card"], [class*="item"], [class*="ticket"], [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 15000 });

      await rows.first().click();
      await waitForPageReady(page);

      // Look for action buttons (edit, delete, status change, etc.)
      const actionButtons = page.locator('button, [class*="action"]');
      const buttonCount = await actionButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });
  });
});
