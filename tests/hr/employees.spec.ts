import { test, expect } from '@playwright/test';
import { navigateTo, waitForPageReady } from '../helpers/auth';

test.describe('الموارد البشرية - HR', () => {

  test('لوحة الموارد البشرية تفتح', async ({ page }) => {
    await navigateTo(page, '/hr');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('قائمة الموظفين تفتح', async ({ page }) => {
    await navigateTo(page, '/hr/employees');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الأقسام تفتح', async ({ page }) => {
    await navigateTo(page, '/hr/departments');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('العقود تفتح', async ({ page }) => {
    await navigateTo(page, '/hr/contracts');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('الرواتب تفتح', async ({ page }) => {
    await navigateTo(page, '/hr/payslips');
    await waitForPageReady(page);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});
