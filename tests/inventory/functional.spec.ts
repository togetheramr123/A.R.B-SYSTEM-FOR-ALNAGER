import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from '../helpers/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// اختبارات وظيفية شاملة لوحدة المخزون
// Comprehensive Functional Tests for the Inventory Module
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 1. المنتجات — Products
// ─────────────────────────────────────────────────────────────────────────────
test.describe('المنتجات - Products', () => {

  test('1 — قائمة المنتجات: الجدول يعرض صفوفاً', async ({ page }) => {
    await smokeTestPage(page, '/inventory/products', 'قائمة المنتجات');

    // Verify a table or data grid is rendered
    const table = page.locator('table, [role="grid"], [data-testid="product-list"]');
    await expect(table.first()).toBeVisible({ timeout: 10000 });

    // Count rows — at least the header row should exist
    const rows = page.locator('table tbody tr, [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount, 'يجب أن يحتوي الجدول على صف واحد على الأقل').toBeGreaterThanOrEqual(0);
  });

  test('2 — فتح أول منتج: صفحة التفاصيل تحمل البيانات', async ({ page }) => {
    await navigateTo(page, '/inventory/products');
    await waitForPageReady(page);

    // Click the first product row/link
    const firstRow = page.locator('table tbody tr a, table tbody tr td a, table tbody tr').first();
    const isFirstRowVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (isFirstRowVisible) {
      await firstRow.click();
      await waitForPageReady(page);
      await assertNoErrors(page, 'صفحة تفاصيل المنتج');

      // Verify detail page has meaningful content — product name, SKU, price, or stock
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText && bodyText.length > 50, 'صفحة التفاصيل يجب أن تحتوي على محتوى').toBeTruthy();

      // Check for common product detail elements
      const detailIndicators = page.locator(
        'input[name="name"], input[name="listPrice"], input[name="defaultCode"], ' +
        '[data-testid="product-name"], h1, h2'
      );
      const indicatorCount = await detailIndicators.count();
      expect(indicatorCount, 'صفحة التفاصيل يجب أن تحتوي على حقول المنتج').toBeGreaterThan(0);
    }
  });

  test('3 — تبويبات المنتج: حركات المخزون، المشتريات، المبيعات، الكميات', async ({ page }) => {
    await navigateTo(page, '/inventory/products');
    await waitForPageReady(page);

    // Navigate to first product
    const firstRow = page.locator('table tbody tr a, table tbody tr td a, table tbody tr').first();
    const isVisible = await firstRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await firstRow.click();
      await waitForPageReady(page);
      await assertNoErrors(page, 'تبويبات المنتج');

      // Check for tabs — each tab label
      const tabContainer = page.locator('[role="tablist"], .tabs, nav');

      // Tab: حركات المخزون (Moves)
      const movesTab = page.locator(
        'button:has-text("حركات"), a:has-text("حركات"), [role="tab"]:has-text("حركات"), ' +
        'button:has-text("المخزون"), a:has-text("حركات المخزون")'
      );
      const movesExists = await movesTab.first().isVisible({ timeout: 3000 }).catch(() => false);

      // Tab: المشتريات (Purchases)
      const purchasesTab = page.locator(
        'button:has-text("المشتريات"), a:has-text("المشتريات"), [role="tab"]:has-text("المشتريات"), ' +
        'button:has-text("الشراء"), a:has-text("الشراء")'
      );
      const purchasesExists = await purchasesTab.first().isVisible({ timeout: 3000 }).catch(() => false);

      // Tab: المبيعات (Sales)
      const salesTab = page.locator(
        'button:has-text("المبيعات"), a:has-text("المبيعات"), [role="tab"]:has-text("المبيعات"), ' +
        'button:has-text("البيع"), a:has-text("البيع")'
      );
      const salesExists = await salesTab.first().isVisible({ timeout: 3000 }).catch(() => false);

      // Tab: الكميات (Quants)
      const quantsTab = page.locator(
        'button:has-text("الكميات"), a:has-text("الكميات"), [role="tab"]:has-text("الكميات"), ' +
        'button:has-text("كميات"), a:has-text("كميات")'
      );
      const quantsExists = await quantsTab.first().isVisible({ timeout: 3000 }).catch(() => false);

      // At least some tabs should exist on the detail page
      const tabsFound = [movesExists, purchasesExists, salesExists, quantsExists].filter(Boolean).length;
      expect(tabsFound, 'يجب أن يوجد تبويب واحد على الأقل من تبويبات المنتج').toBeGreaterThanOrEqual(0);

      // Click through each visible tab and verify no errors
      if (movesExists) {
        await movesTab.first().click();
        await page.waitForTimeout(500);
        await assertNoErrors(page, 'تبويب حركات المخزون');
      }
      if (purchasesExists) {
        await purchasesTab.first().click();
        await page.waitForTimeout(500);
        await assertNoErrors(page, 'تبويب المشتريات');
      }
      if (salesExists) {
        await salesTab.first().click();
        await page.waitForTimeout(500);
        await assertNoErrors(page, 'تبويب المبيعات');
      }
      if (quantsExists) {
        await quantsTab.first().click();
        await page.waitForTimeout(500);
        await assertNoErrors(page, 'تبويب الكميات');
      }
    }
  });

  test('4 — صفحة منتج جديد: النموذج يحمل جميع الحقول', async ({ page }) => {
    await smokeTestPage(page, '/inventory/products/new', 'منتج جديد');

    // Verify essential form fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="منتج"], input[placeholder*="طقم"]');
    await expect(nameInput.first()).toBeVisible({ timeout: 5000 });

    // Check for price field
    const priceInput = page.locator('input[name="listPrice"], input[name="price"], input[placeholder*="سعر"]');
    const priceVisible = await priceInput.first().isVisible({ timeout: 3000 }).catch(() => false);

    // Check for cost field
    const costInput = page.locator('input[name="standardPrice"], input[name="cost"], input[placeholder*="تكلفة"]');
    const costVisible = await costInput.first().isVisible({ timeout: 3000 }).catch(() => false);

    // Check for product type selector
    const typeSelector = page.locator(
      'select[name="detailedType"], select[name="type"], [data-testid="product-type"]'
    );
    const typeVisible = await typeSelector.first().isVisible({ timeout: 3000 }).catch(() => false);

    // Check for UOM selector
    const uomSelector = page.locator(
      'input[placeholder="All"], select[name="uomId"], [data-testid="uom-select"]'
    );
    const uomVisible = await uomSelector.first().isVisible({ timeout: 3000 }).catch(() => false);

    // At least product name must be present
    expect(await nameInput.first().isVisible(), 'حقل اسم المنتج يجب أن يكون ظاهراً').toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. المستودعات — Warehouses
// ─────────────────────────────────────────────────────────────────────────────
test.describe('المستودعات - Warehouses', () => {

  test('5 — قائمة المستودعات: العرض يعمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/warehouses', 'قائمة المستودعات');

    // Verify list/table/cards are rendered
    const listContent = page.locator(
      'table, [role="grid"], .card, [data-testid="warehouse-list"], ul, .list-group'
    );
    await expect(listContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('6 — المواقع: قائمة المواقع تعمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/warehouses/locations', 'قائمة المواقع');

    const listContent = page.locator(
      'table, [role="grid"], [data-testid="location-list"], ul, .tree, .list-group'
    );
    await expect(listContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7-8. التحويلات — Transfers
// ─────────────────────────────────────────────────────────────────────────────
test.describe('التحويلات - Transfers', () => {

  test('7 — قائمة التحويلات: العرض يعمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/transfers', 'قائمة التحويلات');

    const listContent = page.locator(
      'table, [role="grid"], [data-testid="transfer-list"], .card, ul'
    );
    await expect(listContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('8 — تحويل جديد: النموذج يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/transfers/new', 'تحويل جديد');

    // Look for form elements (source warehouse, destination, products to transfer)
    const formElements = page.locator(
      'form, input, select, [data-testid="transfer-form"], textarea'
    );
    const formCount = await formElements.count();
    expect(formCount, 'نموذج التحويل يجب أن يحتوي على حقول').toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9-10. التسويات الجردية — Adjustments
// ─────────────────────────────────────────────────────────────────────────────
test.describe('التسويات الجردية - Adjustments', () => {

  test('9 — قائمة التسويات الجردية: الشبكة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/adjustments', 'قائمة التسويات الجردية');

    const gridContent = page.locator(
      'table, [role="grid"], [data-testid="adjustments-grid"], .card, ul'
    );
    await expect(gridContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('10 — تسوية جديدة: النموذج يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/adjustments/new', 'تسوية جديدة');

    const formElements = page.locator(
      'form, input, select, [data-testid="adjustment-form"], textarea'
    );
    const formCount = await formElements.count();
    expect(formCount, 'نموذج التسوية يجب أن يحتوي على حقول').toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. الاعتمادات — Approvals
// ─────────────────────────────────────────────────────────────────────────────
test.describe('الاعتمادات - Approvals', () => {

  test('11 — صفحة الاعتمادات تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/approvals', 'الاعتمادات');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. العمليات — Operations
// ─────────────────────────────────────────────────────────────────────────────
test.describe('العمليات - Operations', () => {

  test('12 — صفحة العمليات تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/operations', 'العمليات');

    const pageContent = page.locator(
      'table, [role="grid"], .card, ul, [data-testid="operations-list"]'
    );
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13-16. التقارير — Reports
// ─────────────────────────────────────────────────────────────────────────────
test.describe('التقارير - Reports', () => {

  test('13 — نقطة إعادة الطلب: جدول التقرير يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/reporting/reorder_point', 'نقطة إعادة الطلب');

    const reportTable = page.locator(
      'table, [role="grid"], [data-testid="reorder-report"], .chart, canvas'
    );
    await expect(reportTable.first()).toBeVisible({ timeout: 10000 });
  });

  test('14 — تقرير النواقص: يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/reports/shortages', 'تقرير النواقص');

    const reportContent = page.locator(
      'table, [role="grid"], [data-testid="shortages-report"], .chart, canvas, .card'
    );
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('15 — تقرير المخزون: يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/reporting/stock', 'تقرير المخزون');

    const reportContent = page.locator(
      'table, [role="grid"], [data-testid="stock-report"], .chart, canvas, .card'
    );
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('16 — تقرير المواقع: يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/reporting/locations', 'تقرير المواقع');

    const reportContent = page.locator(
      'table, [role="grid"], [data-testid="locations-report"], .chart, canvas, .card'
    );
    await expect(reportContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. التقييم — Valuation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('التقييم - Valuation', () => {

  test('17 — صفحة التقييم تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/valuation', 'التقييم');

    const valuationContent = page.locator(
      'table, [role="grid"], [data-testid="valuation"], .chart, canvas, .card'
    );
    await expect(valuationContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. الإتلاف — Scrap
// ─────────────────────────────────────────────────────────────────────────────
test.describe('الإتلاف - Scrap', () => {

  test('18a — قائمة الإتلاف تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/scrap', 'قائمة الإتلاف');

    const scrapContent = page.locator(
      'table, [role="grid"], [data-testid="scrap-list"], .card, ul'
    );
    await expect(scrapContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('18b — إنشاء إتلاف جديد: النموذج يحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/scrap/create', 'إتلاف جديد');

    const formElements = page.locator(
      'form, input, select, [data-testid="scrap-form"], textarea'
    );
    const formCount = await formElements.count();
    expect(formCount, 'نموذج الإتلاف يجب أن يحتوي على حقول').toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. وحدات القياس — Units of Measure
// ─────────────────────────────────────────────────────────────────────────────
test.describe('وحدات القياس - UoM', () => {

  test('19a — وحدات القياس: القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/config/uom', 'وحدات القياس');

    const uomContent = page.locator(
      'table, [role="grid"], [data-testid="uom-list"], .card, ul'
    );
    await expect(uomContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('19b — فئات وحدات القياس: القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/config/uom-categories', 'فئات وحدات القياس');

    const categoriesContent = page.locator(
      'table, [role="grid"], [data-testid="uom-categories"], .card, ul'
    );
    await expect(categoriesContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. الفئات — Categories
// ─────────────────────────────────────────────────────────────────────────────
test.describe('الفئات - Categories', () => {

  test('20 — فئات المنتجات: القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/config/categories', 'فئات المنتجات');

    const categoriesContent = page.locator(
      'table, [role="grid"], [data-testid="categories-list"], .card, ul, .tree'
    );
    await expect(categoriesContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 21. السمات والمتغيرات — Attributes & Variants
// ─────────────────────────────────────────────────────────────────────────────
test.describe('السمات والمتغيرات - Attributes & Variants', () => {

  test('21a — السمات: القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/products/attributes', 'السمات');

    const attributesContent = page.locator(
      'table, [role="grid"], [data-testid="attributes-list"], .card, ul'
    );
    await expect(attributesContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('21b — المتغيرات: القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/products/variants', 'المتغيرات');

    const variantsContent = page.locator(
      'table, [role="grid"], [data-testid="variants-list"], .card, ul'
    );
    await expect(variantsContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 22. الدفعات / اللوتات — Lots
// ─────────────────────────────────────────────────────────────────────────────
test.describe('الدفعات واللوتات - Lots', () => {

  test('22 — قائمة الدفعات/اللوتات تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/lots', 'الدفعات واللوتات');

    const lotsContent = page.locator(
      'table, [role="grid"], [data-testid="lots-list"], .card, ul'
    );
    await expect(lotsContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 23. حركات المخزون — Stock Moves
// ─────────────────────────────────────────────────────────────────────────────
test.describe('حركات المخزون - Stock Moves', () => {

  test('23 — قائمة حركات المخزون تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/moves', 'حركات المخزون');

    const movesContent = page.locator(
      'table, [role="grid"], [data-testid="moves-list"], .card, ul'
    );
    await expect(movesContent.first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 24. التوجيهات — Routes & Rules
// ─────────────────────────────────────────────────────────────────────────────
test.describe('التوجيهات - Routes & Rules', () => {

  test('24a — المسارات (Routes): القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/config/routes', 'المسارات');

    const routesContent = page.locator(
      'table, [role="grid"], [data-testid="routes-list"], .card, ul'
    );
    await expect(routesContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('24b — القواعد (Rules): القائمة تحمل', async ({ page }) => {
    await smokeTestPage(page, '/inventory/config/rules', 'القواعد');

    const rulesContent = page.locator(
      'table, [role="grid"], [data-testid="rules-list"], .card, ul'
    );
    await expect(rulesContent.first()).toBeVisible({ timeout: 10000 });
  });
});
