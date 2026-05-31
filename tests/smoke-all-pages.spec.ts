import { test, expect } from '@playwright/test';
import { smokeTestPage, navigateTo, waitForPageReady, assertNoErrors } from './helpers/auth';

// ============================================================================
// Comprehensive Smoke Tests - Every Page in the ERP System
// Tests that every page loads without crashing
// ============================================================================

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
test.describe('لوحة التحكم - Dashboard', () => {
  const pages = [
    { path: '/dashboard', name: 'لوحة التحكم' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Inventory Module (35+ pages)
// ---------------------------------------------------------------------------
test.describe('المخزون - Inventory', () => {
  const pages = [
    { path: '/inventory', name: 'الصفحة الرئيسية للمخزون' },
    { path: '/inventory/products', name: 'المنتجات' },
    { path: '/inventory/products/new', name: 'إنشاء منتج جديد' },
    { path: '/inventory/products/attributes', name: 'سمات المنتجات' },
    { path: '/inventory/products/categories', name: 'فئات المنتجات' },
    { path: '/inventory/products/variants', name: 'متغيرات المنتجات' },
    { path: '/inventory/warehouses', name: 'المستودعات' },
    { path: '/inventory/warehouses/new', name: 'إنشاء مستودع جديد' },
    { path: '/inventory/warehouses/locations', name: 'مواقع المستودعات' },
    { path: '/inventory/transfers', name: 'التحويلات' },
    { path: '/inventory/transfers/new', name: 'إنشاء تحويل جديد' },
    { path: '/inventory/adjustments', name: 'التسويات' },
    { path: '/inventory/adjustments/new', name: 'إنشاء تسوية جديدة' },
    { path: '/inventory/approvals', name: 'الموافقات' },
    { path: '/inventory/operations', name: 'العمليات' },
    { path: '/inventory/operations/reordering', name: 'إعادة الطلب' },
    { path: '/inventory/operations/replenishment', name: 'التجديد' },
    { path: '/inventory/operations/scrap', name: 'عمليات الخردة' },
    { path: '/inventory/lots', name: 'الدفعات' },
    { path: '/inventory/moves', name: 'حركات المخزون' },
    { path: '/inventory/valuation', name: 'تقييم المخزون' },
    { path: '/inventory/scrap', name: 'الخردة' },
    { path: '/inventory/scrap/create', name: 'إنشاء خردة' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

test.describe('المخزون - إعدادات - Inventory Config', () => {
  const pages = [
    { path: '/inventory/config/categories', name: 'فئات الإعدادات' },
    { path: '/inventory/config/categories/new', name: 'إنشاء فئة إعدادات جديدة' },
    { path: '/inventory/config/uom', name: 'وحدات القياس' },
    { path: '/inventory/config/uom-categories', name: 'فئات وحدات القياس' },
    { path: '/inventory/config/operation-types', name: 'أنواع العمليات' },
    { path: '/inventory/config/delivery-methods', name: 'طرق التوصيل' },
    { path: '/inventory/config/putaway', name: 'قواعد التخزين' },
    { path: '/inventory/config/putaway-rules', name: 'قواعد التخزين التفصيلية' },
    { path: '/inventory/config/putaway/new', name: 'إنشاء قاعدة تخزين جديدة' },
    { path: '/inventory/config/routes', name: 'المسارات' },
    { path: '/inventory/config/routes/new', name: 'إنشاء مسار جديد' },
    { path: '/inventory/config/rules', name: 'القواعد' },
    { path: '/inventory/config/rules/new', name: 'إنشاء قاعدة جديدة' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

test.describe('المخزون - التقارير - Inventory Reports', () => {
  const pages = [
    { path: '/inventory/reporting/stock', name: 'تقرير المخزون' },
    { path: '/inventory/reporting/locations', name: 'تقرير المواقع' },
    { path: '/inventory/reporting/reorder_point', name: 'تقرير نقطة إعادة الطلب' },
    { path: '/inventory/reporting/shortage', name: 'تقرير النقص' },
    { path: '/inventory/reports/shortages', name: 'تقرير النواقص' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Accounting Module (40+ pages)
// ---------------------------------------------------------------------------
test.describe('المحاسبة - Accounting', () => {
  const pages = [
    { path: '/accounting', name: 'الصفحة الرئيسية للمحاسبة' },
    { path: '/accounting/invoices', name: 'الفواتير' },
    { path: '/accounting/invoices/new', name: 'إنشاء فاتورة جديدة' },
    { path: '/accounting/bills', name: 'فواتير الموردين' },
    { path: '/accounting/bills/create', name: 'إنشاء فاتورة مورد' },
    { path: '/accounting/bills/refunds', name: 'المبالغ المستردة' },
    { path: '/accounting/payments', name: 'المدفوعات' },
    { path: '/accounting/receipts', name: 'الإيصالات' },
    { path: '/accounting/disbursements', name: 'المصروفات' },
    { path: '/accounting/returns', name: 'المرتجعات' },
    { path: '/accounting/chart-of-accounts', name: 'دليل الحسابات' },
    { path: '/accounting/journal-entries', name: 'القيود اليومية' },
    { path: '/accounting/journal-items', name: 'بنود القيود' },
    { path: '/accounting/journals', name: 'الدفاتر' },
    { path: '/accounting/budgets', name: 'الميزانيات' },
    { path: '/accounting/cash-registers', name: 'الصناديق النقدية' },
    { path: '/accounting/cash-registers/new-transaction', name: 'معاملة صندوق جديدة' },
    { path: '/accounting/cash-registers/settlements', name: 'تسويات الصناديق' },
    { path: '/accounting/cheques', name: 'الشيكات' },
    { path: '/accounting/petty-cash', name: 'النثريات' },
    { path: '/accounting/price-lists', name: 'قوائم الأسعار' },
    { path: '/accounting/opening-balances', name: 'الأرصدة الافتتاحية' },
    { path: '/accounting/partner_ledger', name: 'دفتر أستاذ الشركاء' },
    { path: '/accounting/profit-loss', name: 'الأرباح والخسائر' },
    { path: '/accounting/reconciliation', name: 'التسوية البنكية' },
    { path: '/accounting/reconciliation/widget', name: 'أداة التسوية' },
    { path: '/accounting/statements', name: 'كشوف الحسابات' },
    { path: '/accounting/trial-balance', name: 'ميزان المراجعة' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

test.describe('المحاسبة - التقارير - Accounting Reports', () => {
  const pages = [
    { path: '/accounting/reporting', name: 'الصفحة الرئيسية للتقارير المحاسبية' },
    { path: '/accounting/reporting/aged_balance', name: 'تقرير أعمار الأرصدة' },
    { path: '/accounting/reporting/balance_sheet', name: 'الميزانية العمومية (underscore)' },
    { path: '/accounting/reporting/balance-sheet', name: 'الميزانية العمومية (dash)' },
    { path: '/accounting/reporting/budgets', name: 'تقرير الميزانيات' },
    { path: '/accounting/reporting/cash_flow', name: 'التدفق النقدي' },
    { path: '/accounting/reporting/comparative-pl', name: 'الأرباح والخسائر المقارنة' },
    { path: '/accounting/reporting/cost-centers', name: 'مراكز التكلفة' },
    { path: '/accounting/reporting/ledger', name: 'دفتر الأستاذ' },
    { path: '/accounting/reporting/partner_ledger', name: 'تقرير دفتر أستاذ الشركاء' },
    { path: '/accounting/reporting/profit_and_loss', name: 'تقرير الأرباح والخسائر (underscore)' },
    { path: '/accounting/reporting/profit-loss', name: 'تقرير الأرباح والخسائر (dash)' },
    { path: '/accounting/reporting/tax', name: 'تقرير الضرائب' },
    { path: '/accounting/reporting/trial_balance', name: 'تقرير ميزان المراجعة' },
    { path: '/accounting/reports/pl', name: 'تقرير الأرباح والخسائر المختصر' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

test.describe('المحاسبة - الإعدادات - Accounting Configuration', () => {
  const pages = [
    { path: '/accounting/configuration/analytic_accounts', name: 'الحسابات التحليلية' },
    { path: '/accounting/configuration/asset_categories', name: 'فئات الأصول' },
    { path: '/accounting/configuration/audit', name: 'التدقيق المحاسبي' },
    { path: '/accounting/configuration/journals', name: 'إعدادات الدفاتر' },
    { path: '/accounting/configuration/year-end', name: 'إقفال نهاية السنة' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Sales Module (12 pages)
// ---------------------------------------------------------------------------
test.describe('المبيعات - Sales', () => {
  const pages = [
    { path: '/sales', name: 'الصفحة الرئيسية للمبيعات' },
    { path: '/sales/orders', name: 'أوامر البيع' },
    { path: '/sales/new', name: 'إنشاء أمر بيع جديد' },
    { path: '/sales/lines', name: 'بنود المبيعات' },
    { path: '/sales/analysis', name: 'تحليل المبيعات' },
    { path: '/sales/pricelists', name: 'قوائم أسعار المبيعات' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Purchases Module (10 pages)
// ---------------------------------------------------------------------------
test.describe('المشتريات - Purchases', () => {
  const pages = [
    { path: '/purchases', name: 'الصفحة الرئيسية للمشتريات' },
    { path: '/purchases/orders', name: 'أوامر الشراء' },
    { path: '/purchases/new', name: 'إنشاء أمر شراء جديد' },
    { path: '/purchases/lines', name: 'بنود المشتريات' },
    { path: '/purchases/analysis', name: 'تحليل المشتريات' },
    { path: '/purchases/configuration', name: 'إعدادات المشتريات' },
    { path: '/purchases/pricelists', name: 'قوائم أسعار المشتريات' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// HR Module (10 pages)
// ---------------------------------------------------------------------------
test.describe('الموارد البشرية - HR', () => {
  const pages = [
    { path: '/hr', name: 'الصفحة الرئيسية للموارد البشرية' },
    { path: '/hr/employees', name: 'الموظفين' },
    { path: '/hr/employees/new', name: 'إضافة موظف جديد' },
    { path: '/hr/departments', name: 'الأقسام' },
    { path: '/hr/contracts', name: 'العقود' },
    { path: '/hr/contracts/templates', name: 'قوالب العقود' },
    { path: '/hr/payslips', name: 'قسائم الرواتب' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
test.describe('جهات الاتصال - Contacts', () => {
  const pages = [
    { path: '/contacts', name: 'جهات الاتصال' },
    { path: '/contacts/create', name: 'إنشاء جهة اتصال' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------
test.describe('إدارة علاقات العملاء - CRM', () => {
  const pages = [
    { path: '/crm/tickets', name: 'تذاكر الدعم' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
test.describe('التحليلات - Analytics', () => {
  const pages = [
    { path: '/analytics', name: 'التحليلات' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
test.describe('التقارير - Reports', () => {
  const pages = [
    { path: '/reports/debt-followup', name: 'متابعة الديون' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------
test.describe('الكتالوجات - Catalogs', () => {
  const pages = [
    { path: '/catalogs', name: 'الكتالوجات' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Settings (15 pages)
// ---------------------------------------------------------------------------
test.describe('الإعدادات - Settings', () => {
  const pages = [
    { path: '/settings', name: 'الإعدادات العامة' },
    { path: '/settings/users', name: 'المستخدمون' },
    { path: '/settings/groups', name: 'المجموعات' },
    { path: '/settings/import', name: 'استيراد البيانات' },
    { path: '/settings/integrations', name: 'التكاملات' },
    { path: '/settings/notifications', name: 'الإشعارات' },
    { path: '/settings/ocr-mapping', name: 'ربط التعرف الضوئي' },
    { path: '/settings/odoo-sync', name: 'مزامنة أودو' },
    { path: '/settings/performance', name: 'الأداء' },
    { path: '/settings/portal', name: 'البوابة' },
    { path: '/settings/reset', name: 'إعادة التعيين' },
    { path: '/settings/database-archiving', name: 'أرشفة قاعدة البيانات' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});

// ---------------------------------------------------------------------------
// Manual / Other
// ---------------------------------------------------------------------------
test.describe('أخرى - Other', () => {
  const pages = [
    { path: '/manual', name: 'الدليل' },
  ];

  for (const p of pages) {
    test(`${p.name} (${p.path})`, async ({ page }) => {
      await smokeTestPage(page, p.path, p.name);
    });
  }
});
