import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('المحاسبة - الفواتير', () => {
  test('فتح صفحة الفواتير وتفحص محتواها', async ({ page }) => {
    await navigateTo(page, '/accounting/invoices');
    await waitForPageReady(page);
    await assertNoErrors(page, 'صفحة الفواتير');

    // Verify table or list renders with data
    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });

    // Verify there are rows (data present)
    const rows = page.locator('tbody tr, [role="row"], [class*="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('فتح صفحة إنشاء فاتورة جديدة', async ({ page }) => {
    await navigateTo(page, '/accounting/invoices/new');
    await waitForPageReady(page);
    await assertNoErrors(page, 'إنشاء فاتورة جديدة');

    // Verify the form loads
    const form = page.locator('form, [class*="form"], [role="form"]');
    await expect(form.first()).toBeVisible({ timeout: 10000 });

    // Verify key fields are present: partner, date, lines table, taxes, discounts
    const partnerField = page.locator('[name*="partner"], [name*="customer"], [class*="partner"], [placeholder*="شريك"], [placeholder*="عميل"], label:has-text("شريك"), label:has-text("عميل"), label:has-text("Partner"), label:has-text("Customer")');
    await expect(partnerField.first()).toBeVisible({ timeout: 5000 });

    const dateField = page.locator('[name*="date"], [type="date"], [class*="date"], input[placeholder*="تاريخ"], label:has-text("تاريخ"), label:has-text("Date")');
    await expect(dateField.first()).toBeVisible({ timeout: 5000 });

    // Verify invoice lines table area
    const linesArea = page.locator('table, [class*="lines"], [class*="items"], [class*="products"]');
    await expect(linesArea.first()).toBeVisible({ timeout: 5000 });
  });

  test('فتح أول فاتورة موجودة', async ({ page }) => {
    await navigateTo(page, '/accounting/invoices');
    await waitForPageReady(page);
    await assertNoErrors(page, 'قائمة الفواتير');

    // Click the first row/link to open a specific invoice
    const firstRow = page.locator('tbody tr, [role="row"]:not([role="row"]:first-child)').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    await waitForPageReady(page);
    await assertNoErrors(page, 'تفاصيل الفاتورة');

    // Verify detail page loaded (should have invoice content)
    const detailContent = page.locator('[class*="detail"], [class*="invoice"], [class*="form"], form, [class*="card"], main');
    await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - المدفوعات', () => {
  test('فتح صفحة المدفوعات وتفحصها', async ({ page }) => {
    await navigateTo(page, '/accounting/payments');
    await waitForPageReady(page);
    await assertNoErrors(page, 'صفحة المدفوعات');

    // Verify list loads
    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });

    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('المحاسبة - شجرة الحسابات', () => {
  test('فتح شجرة الحسابات', async ({ page }) => {
    await navigateTo(page, '/accounting/chart-of-accounts');
    await waitForPageReady(page);
    await assertNoErrors(page, 'شجرة الحسابات');

    // Verify accounts tree/list renders
    const treeOrList = page.locator('table, [role="table"], [role="tree"], [class*="tree"], [class*="table"], [class*="list"], [class*="accounts"], ul, ol');
    await expect(treeOrList.first()).toBeVisible({ timeout: 10000 });
  });

  test('فتح أول حساب', async ({ page }) => {
    await navigateTo(page, '/accounting/chart-of-accounts');
    await waitForPageReady(page);
    await assertNoErrors(page, 'شجرة الحسابات - قبل الفتح');

    // Click into the first account
    const firstAccount = page.locator('tbody tr, [role="row"], [role="treeitem"], [class*="account-row"], li a').first();
    await expect(firstAccount).toBeVisible({ timeout: 10000 });
    await firstAccount.click();

    await waitForPageReady(page);
    await assertNoErrors(page, 'تفاصيل الحساب');

    // Verify detail page loaded
    const detailContent = page.locator('[class*="detail"], [class*="account"], [class*="form"], form, [class*="card"], main');
    await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - القيود المحاسبية', () => {
  test('فتح القيود المحاسبية', async ({ page }) => {
    await navigateTo(page, '/accounting/journal-entries');
    await waitForPageReady(page);
    await assertNoErrors(page, 'القيود المحاسبية');

    // Verify list renders
    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });

    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('فتح أول قيد محاسبي', async ({ page }) => {
    await navigateTo(page, '/accounting/journal-entries');
    await waitForPageReady(page);
    await assertNoErrors(page, 'القيود المحاسبية - قبل الفتح');

    // Click the first journal entry
    const firstEntry = page.locator('tbody tr').first();
    await expect(firstEntry).toBeVisible({ timeout: 10000 });
    await firstEntry.click();

    await waitForPageReady(page);
    await assertNoErrors(page, 'تفاصيل القيد المحاسبي');

    // Verify detail page loaded
    const detailContent = page.locator('[class*="detail"], [class*="journal"], [class*="entry"], [class*="form"], form, [class*="card"], main');
    await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - التقارير', () => {
  test('فتح الميزانية العمومية', async ({ page }) => {
    await navigateTo(page, '/accounting/reporting/balance_sheet');
    await waitForPageReady(page);
    await assertNoErrors(page, 'الميزانية العمومية');

    // Verify report content renders
    const reportContent = page.locator('table, [class*="report"], [class*="balance"], [class*="sheet"], [class*="card"], main');
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('فتح الأرباح والخسائر', async ({ page }) => {
    await navigateTo(page, '/accounting/reporting/profit_and_loss');
    await waitForPageReady(page);
    await assertNoErrors(page, 'الأرباح والخسائر');

    const reportContent = page.locator('table, [class*="report"], [class*="profit"], [class*="loss"], [class*="card"], main');
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('فتح ميزان المراجعة', async ({ page }) => {
    await navigateTo(page, '/accounting/reporting/trial_balance');
    await waitForPageReady(page);
    await assertNoErrors(page, 'ميزان المراجعة');

    const reportContent = page.locator('table, [class*="report"], [class*="trial"], [class*="balance"], [class*="card"], main');
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('فتح تقرير الأعمار', async ({ page }) => {
    await navigateTo(page, '/accounting/reporting/aged_balance');
    await waitForPageReady(page);
    await assertNoErrors(page, 'تقرير الأعمار');

    const reportContent = page.locator('table, [class*="report"], [class*="aged"], [class*="balance"], [class*="card"], main');
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - كشف حساب الشريك', () => {
  test('فتح كشف حساب الشريك', async ({ page }) => {
    await navigateTo(page, '/accounting/partner_ledger');
    await waitForPageReady(page);
    await assertNoErrors(page, 'كشف حساب الشريك');

    const content = page.locator('table, [class*="report"], [class*="ledger"], [class*="partner"], [class*="card"], main');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - الشيكات', () => {
  test('فتح الشيكات', async ({ page }) => {
    await navigateTo(page, '/accounting/cheques');
    await waitForPageReady(page);
    await assertNoErrors(page, 'الشيكات');

    // Verify list renders
    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - الصناديق النقدية', () => {
  test('فتح الصناديق النقدية', async ({ page }) => {
    await navigateTo(page, '/accounting/cash-registers');
    await waitForPageReady(page);
    await assertNoErrors(page, 'الصناديق النقدية');

    // Verify list renders
    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"], [class*="card"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });
  });

  test('فتح تسويات الصناديق', async ({ page }) => {
    await navigateTo(page, '/accounting/cash-registers/settlements');
    await waitForPageReady(page);
    await assertNoErrors(page, 'تسويات الصناديق');

    const content = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="settlement"], [class*="card"], main');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - السندات (قبض/صرف)', () => {
  test('فتح سندات القبض', async ({ page }) => {
    await navigateTo(page, '/accounting/receipts');
    await waitForPageReady(page);
    await assertNoErrors(page, 'سندات القبض');

    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });
  });

  test('فتح سندات الصرف', async ({ page }) => {
    await navigateTo(page, '/accounting/disbursements');
    await waitForPageReady(page);
    await assertNoErrors(page, 'سندات الصرف');

    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('المحاسبة - فواتير الموردين', () => {
  test('فتح فاتورة المورد (Bill)', async ({ page }) => {
    await navigateTo(page, '/accounting/bills');
    await waitForPageReady(page);
    await assertNoErrors(page, 'فواتير الموردين');

    // Verify list renders
    const table = page.locator('table, [role="table"], [class*="table"], [class*="list"], [class*="grid"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });

    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('فتح إنشاء فاتورة مورد', async ({ page }) => {
    await navigateTo(page, '/accounting/bills/create');
    await waitForPageReady(page);
    await assertNoErrors(page, 'إنشاء فاتورة مورد');

    // Verify form loads
    const form = page.locator('form, [class*="form"], [role="form"]');
    await expect(form.first()).toBeVisible({ timeout: 10000 });

    // Verify key fields: vendor/partner, date
    const vendorField = page.locator('[name*="partner"], [name*="vendor"], [name*="supplier"], [class*="partner"], [class*="vendor"], [placeholder*="مورد"], [placeholder*="شريك"], label:has-text("مورد"), label:has-text("شريك"), label:has-text("Vendor"), label:has-text("Supplier")');
    await expect(vendorField.first()).toBeVisible({ timeout: 5000 });

    const dateField = page.locator('[name*="date"], [type="date"], [class*="date"], input[placeholder*="تاريخ"], label:has-text("تاريخ"), label:has-text("Date")');
    await expect(dateField.first()).toBeVisible({ timeout: 5000 });

    // Verify bill lines area
    const linesArea = page.locator('table, [class*="lines"], [class*="items"], [class*="products"]');
    await expect(linesArea.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('المحاسبة - إقفال السنة المالية', () => {
  test('فتح إقفال السنة المالية', async ({ page }) => {
    await navigateTo(page, '/accounting/configuration/year-end');
    await waitForPageReady(page);
    await assertNoErrors(page, 'إقفال السنة المالية');

    // Verify page content renders
    const content = page.locator('form, [class*="form"], [class*="year"], [class*="closing"], [class*="card"], button, main');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});
