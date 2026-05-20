import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from './helpers/auth';

test.describe('التنقل العام - Navigation', () => {

  test('الصفحة الرئيسية تفتح بنجاح', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await waitForPageReady(page);
    // Should see the dashboard page without errors
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Server Error');
  });

  const sidebarRoutes = [
    { name: 'لوحة التحكم', path: '/dashboard' },
    { name: 'المخازن', path: '/inventory' },
    { name: 'المنتجات', path: '/inventory/products' },
    { name: 'المشتريات', path: '/purchases' },
    { name: 'المبيعات', path: '/sales' },
    { name: 'المحاسبة', path: '/accounting' },
    { name: 'جهات الاتصال', path: '/contacts' },
    { name: 'الموارد البشرية', path: '/hr' },
    { name: 'الإعدادات', path: '/settings' },
  ];

  for (const route of sidebarRoutes) {
    test(`صفحة "${route.name}" (${route.path}) تفتح بدون أخطاء`, async ({ page }) => {
      await navigateTo(page, route.path);
      await waitForPageReady(page);
      
      // Page should not show error
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).not.toContainText('Server Error');
      await expect(page.locator('body')).not.toContainText('This page could not be found');
      
      // Page should have content (not blank)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText && bodyText.trim().length > 0).toBeTruthy();
    });
  }

  // Sub-pages within modules
  const subPages = [
    { name: 'المستودعات', path: '/inventory/warehouses' },
    { name: 'عمليات النقل', path: '/inventory/transfers' },
    { name: 'تعديلات المخزون', path: '/inventory/adjustments' },
    { name: 'شجرة الحسابات', path: '/accounting/chart-of-accounts' },
    { name: 'القيود المحاسبية', path: '/accounting/journal-entries' },
    { name: 'الفواتير', path: '/accounting/invoices' },
    { name: 'المدفوعات', path: '/accounting/payments' },
    { name: 'الموظفين', path: '/hr/employees' },
  ];

  for (const route of subPages) {
    test(`صفحة فرعية "${route.name}" (${route.path}) تفتح بدون أخطاء`, async ({ page }) => {
      await navigateTo(page, route.path);
      await waitForPageReady(page);
      
      await expect(page.locator('body')).not.toContainText('Application error');
      await expect(page.locator('body')).not.toContainText('Server Error');
    });
  }
});
