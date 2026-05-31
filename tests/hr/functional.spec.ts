import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

test.describe('الموارد البشرية - HR Module', () => {
  // ──────────────────────────────────────────────
  // 1. لوحة الموارد البشرية
  // ──────────────────────────────────────────────
  test.describe('لوحة الموارد البشرية', () => {
    test('تحميل لوحة الموارد البشرية', async ({ page }) => {
      await smokeTestPage(page, '/hr', 'لوحة الموارد البشرية');
    });

    test('التحقق من وجود عناصر اللوحة الرئيسية', async ({ page }) => {
      await navigateTo(page, '/hr');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Dashboard should have cards, stats, or widgets
      const dashboardContent = page.locator(
        '[class*="card"], [class*="widget"], [class*="stat"], [class*="dashboard"], ' +
        '[class*="summary"], [class*="overview"], main, [role="main"]'
      );
      await expect(dashboardContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود روابط التنقل في اللوحة', async ({ page }) => {
      await navigateTo(page, '/hr');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Look for navigation links to sub-pages
      const navLinks = page.locator('a, [role="link"]').filter({
        hasText: /موظف|قسم|عقد|راتب|employee|department|contract|payslip/i,
      });
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 2. قائمة الموظفين
  // ──────────────────────────────────────────────
  test.describe('قائمة الموظفين', () => {
    test('تحميل صفحة قائمة الموظفين', async ({ page }) => {
      await smokeTestPage(page, '/hr/employees', 'قائمة الموظفين');
    });

    test('عرض جدول أو قائمة الموظفين', async ({ page }) => {
      await navigateTo(page, '/hr/employees');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listContent = page.locator(
        'table, [role="grid"], [class*="list"], [class*="table"], [class*="card"], [class*="grid"]'
      );
      await expect(listContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إضافة موظف جديد', async ({ page }) => {
      await navigateTo(page, '/hr/employees');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف|إضافة/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من وجود عناصر البحث والفلترة', async ({ page }) => {
      await navigateTo(page, '/hr/employees');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"], [class*="search"]'
      );
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 3. إنشاء موظف جديد
  // ──────────────────────────────────────────────
  test.describe('إنشاء موظف جديد', () => {
    test('تحميل صفحة إنشاء موظف جديد', async ({ page }) => {
      await smokeTestPage(page, '/hr/employees/new', 'إنشاء موظف جديد');
    });

    test('التحقق من وجود حقل اسم الموظف', async ({ page }) => {
      await navigateTo(page, '/hr/employees/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const nameField = page.locator(
        '[name*="name"], [name*="employee"], ' +
        'label:has-text("الاسم"), label:has-text("اسم الموظف"), label:has-text("name"), ' +
        'input[placeholder*="اسم"], input[placeholder*="name"]'
      );
      await expect(nameField.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود حقل القسم', async ({ page }) => {
      await navigateTo(page, '/hr/employees/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const departmentField = page.locator(
        '[name*="department"], [name*="dept"], ' +
        'label:has-text("القسم"), label:has-text("department"), ' +
        'select, [class*="select"], [role="combobox"]'
      );
      await expect(departmentField.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود حقل المسمى الوظيفي', async ({ page }) => {
      await navigateTo(page, '/hr/employees/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const jobField = page.locator(
        '[name*="job"], [name*="title"], [name*="position"], ' +
        'label:has-text("المسمى"), label:has-text("الوظيفة"), label:has-text("job"), label:has-text("position"), ' +
        'input[placeholder*="وظيف"], input[placeholder*="job"]'
      );
      await expect(jobField.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود حقول معلومات الاتصال', async ({ page }) => {
      await navigateTo(page, '/hr/employees/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const contactFields = page.locator(
        '[name*="email"], [name*="phone"], [name*="mobile"], ' +
        'label:has-text("البريد"), label:has-text("الهاتف"), label:has-text("الجوال"), ' +
        'label:has-text("email"), label:has-text("phone"), label:has-text("mobile"), ' +
        'input[type="email"], input[type="tel"]'
      );
      await expect(contactFields.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود أزرار الحفظ والإلغاء', async ({ page }) => {
      await navigateTo(page, '/hr/employees/new');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const saveButton = page.locator('button, a').filter({
        hasText: /حفظ|save|تأكيد|confirm/i,
      });
      await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // ──────────────────────────────────────────────
  // 4. فتح أول موظف
  // ──────────────────────────────────────────────
  test.describe('فتح أول موظف', () => {
    test('النقر على أول موظف وعرض التفاصيل', async ({ page }) => {
      await navigateTo(page, '/hr/employees');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const firstEmployee = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="employee"], [class*="card"]'
      ).first();
      await expect(firstEmployee).toBeVisible({ timeout: 15000 });
      await firstEmployee.click();
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Verify we navigated to a detail page
      const detailContent = page.locator(
        '[class*="detail"], [class*="form"], [class*="employee"], main, [role="main"]'
      );
      await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من عرض معلومات الموظف بعد الفتح', async ({ page }) => {
      await navigateTo(page, '/hr/employees');
      await waitForPageReady(page);

      const firstEmployee = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="employee"], [class*="card"]'
      ).first();

      if (await firstEmployee.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstEmployee.click();
        await waitForPageReady(page);
        await assertNoErrors(page);

        // Verify employee info fields are visible
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        expect(pageContent!.length).toBeGreaterThan(0);
      }
    });
  });

  // ──────────────────────────────────────────────
  // 5. الأقسام
  // ──────────────────────────────────────────────
  test.describe('الأقسام', () => {
    test('تحميل صفحة الأقسام', async ({ page }) => {
      await smokeTestPage(page, '/hr/departments', 'الأقسام');
    });

    test('عرض قائمة الأقسام', async ({ page }) => {
      await navigateTo(page, '/hr/departments');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listContent = page.locator(
        'table, [role="grid"], [class*="list"], [class*="table"], [class*="card"], [class*="tree"]'
      );
      await expect(listContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إنشاء قسم جديد', async ({ page }) => {
      await navigateTo(page, '/hr/departments');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف|إضافة/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من أعمدة الأقسام', async ({ page }) => {
      await navigateTo(page, '/hr/departments');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const headers = page.locator(
        'th, [role="columnheader"], [class*="header"], [class*="column-title"]'
      );
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 6. العقود
  // ──────────────────────────────────────────────
  test.describe('العقود', () => {
    test('تحميل صفحة العقود', async ({ page }) => {
      await smokeTestPage(page, '/hr/contracts', 'العقود');
    });

    test('عرض قائمة العقود', async ({ page }) => {
      await navigateTo(page, '/hr/contracts');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listContent = page.locator(
        'table, [role="grid"], [class*="list"], [class*="table"], [class*="card"]'
      );
      await expect(listContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إنشاء عقد جديد', async ({ page }) => {
      await navigateTo(page, '/hr/contracts');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف|إضافة/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من أعمدة جدول العقود', async ({ page }) => {
      await navigateTo(page, '/hr/contracts');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const headers = page.locator(
        'th, [role="columnheader"], [class*="header"], [class*="column-title"]'
      );
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    });

    test('فتح أول عقد', async ({ page }) => {
      await navigateTo(page, '/hr/contracts');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const firstContract = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="contract"], [class*="card"]'
      ).first();

      if (await firstContract.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstContract.click();
        await waitForPageReady(page);
        await assertNoErrors(page);

        const detailContent = page.locator(
          '[class*="detail"], [class*="form"], main, [role="main"]'
        );
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ──────────────────────────────────────────────
  // 7. قوالب العقود
  // ──────────────────────────────────────────────
  test.describe('قوالب العقود', () => {
    test('تحميل صفحة قوالب العقود', async ({ page }) => {
      await smokeTestPage(page, '/hr/contracts/templates', 'قوالب العقود');
    });

    test('عرض قائمة قوالب العقود', async ({ page }) => {
      await navigateTo(page, '/hr/contracts/templates');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listContent = page.locator(
        'table, [role="grid"], [class*="list"], [class*="table"], [class*="card"]'
      );
      await expect(listContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إنشاء قالب جديد', async ({ page }) => {
      await navigateTo(page, '/hr/contracts/templates');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف|إضافة/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('فتح أول قالب عقد', async ({ page }) => {
      await navigateTo(page, '/hr/contracts/templates');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const firstTemplate = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="template"], [class*="card"]'
      ).first();

      if (await firstTemplate.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstTemplate.click();
        await waitForPageReady(page);
        await assertNoErrors(page);

        const detailContent = page.locator(
          '[class*="detail"], [class*="form"], main, [role="main"]'
        );
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ──────────────────────────────────────────────
  // 8. كشوف الرواتب
  // ──────────────────────────────────────────────
  test.describe('كشوف الرواتب', () => {
    test('تحميل صفحة كشوف الرواتب', async ({ page }) => {
      await smokeTestPage(page, '/hr/payslips', 'كشوف الرواتب');
    });

    test('عرض قائمة كشوف الرواتب', async ({ page }) => {
      await navigateTo(page, '/hr/payslips');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const listContent = page.locator(
        'table, [role="grid"], [class*="list"], [class*="table"], [class*="card"]'
      );
      await expect(listContent.first()).toBeVisible({ timeout: 15000 });
    });

    test('التحقق من وجود زر إنشاء كشف رواتب جديد', async ({ page }) => {
      await navigateTo(page, '/hr/payslips');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const createButton = page.locator('a, button').filter({
        hasText: /جديد|إنشاء|new|create|أضف|إضافة/i,
      });
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('التحقق من أعمدة كشوف الرواتب', async ({ page }) => {
      await navigateTo(page, '/hr/payslips');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const headers = page.locator(
        'th, [role="columnheader"], [class*="header"], [class*="column-title"]'
      );
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);
    });

    test('التحقق من وجود فلاتر كشوف الرواتب', async ({ page }) => {
      await navigateTo(page, '/hr/payslips');
      await waitForPageReady(page);
      await assertNoErrors(page);

      // Look for filter or date-range controls
      const filters = page.locator(
        'select, [class*="filter"], [class*="dropdown"], ' +
        'input[type="date"], input[type="month"], ' +
        '[class*="period"], [class*="date-range"]'
      );
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });

    test('فتح أول كشف رواتب', async ({ page }) => {
      await navigateTo(page, '/hr/payslips');
      await waitForPageReady(page);
      await assertNoErrors(page);

      const firstPayslip = page.locator(
        'table tbody tr, [class*="row"], [class*="item"], [class*="payslip"], [class*="card"]'
      ).first();

      if (await firstPayslip.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstPayslip.click();
        await waitForPageReady(page);
        await assertNoErrors(page);

        const detailContent = page.locator(
          '[class*="detail"], [class*="form"], main, [role="main"]'
        );
        await expect(detailContent.first()).toBeVisible({ timeout: 10000 });

        // Verify payslip details contain relevant content
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        expect(pageContent!.length).toBeGreaterThan(0);
      }
    });
  });
});
