import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('المحاسبة - Accounting', () => {

  test('لوحة المحاسبة تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('شجرة الحسابات تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/chart-of-accounts');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('القيود المحاسبية تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/journal-entries');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الفواتير تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/invoices');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('المدفوعات تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/payments');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الدفاتر تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/journals');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('ميزان المراجعة يفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/trial-balance');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الأرباح والخسائر تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/profit-loss');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الأصول الثابتة تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/assets');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الميزانيات تفتح', async ({ page }) => {
    await navigateTo(page, '/accounting/budgets');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
