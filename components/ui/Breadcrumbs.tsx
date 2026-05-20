'use client'; import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBreadcrumbsStore } from '@/store/breadcrumbsStore';

const ROUTE_MAP: Record<string, { label: string; listPath?: string }> = {
  dashboard: { label: 'لوحة التحكم' },
  contacts: { label: 'جهات الاتصال' },
  inventory: { label: 'المخازن' },
  'inventory/products': { label: 'المنتجات' },
  'inventory/products/new': { label: 'منتج جديد', listPath: 'inventory/products' },
  'inventory/products/variants': { label: 'متغيرات المنتج', listPath: 'inventory/products' },
  'inventory/products/categories': { label: 'فئات المنتجات', listPath: 'inventory/products' },
  'inventory/operations': { label: 'العمليات' },
  'inventory/lots': { label: 'اللوتات / السيريال' },
  'inventory/adjustments': { label: 'تعديلات المخزون' },
  'inventory/adjustments/new': { label: 'تعديل جديد', listPath: 'inventory/adjustments' },
  'inventory/valuation': { label: 'تقييم المخزون' },
  'inventory/scrap': { label: 'الإتلاف' },
  'inventory/reporting/reorder_point': { label: 'تحليل نقاط إعادة الطلب' },
  sales: { label: 'المبيعات' },
  'sales/new': { label: 'طلب بيع جديد', listPath: 'sales' },
  'sales/analysis': { label: 'تحليل المبيعات' },
  'sales/pricelists': { label: 'قوائم الأسعار' },
  purchases: { label: 'المشتريات' },
  'purchases/new': { label: 'طلب شراء جديد', listPath: 'purchases' },
  'accounting/invoices': { label: 'فواتير العملاء' },
  'accounting/invoices/new': { label: 'فاتورة جديدة', listPath: 'accounting/invoices' },
  'accounting/bills': { label: 'فواتير الشراء' },
  'accounting/bills/new': { label: 'فاتورة شراء جديدة', listPath: 'accounting/bills' },
  'accounting/payments': { label: 'المدفوعات' },
  'accounting/payments/new': { label: 'دفعة جديدة', listPath: 'accounting/payments' },
  'accounting/receipts': { label: 'سندات القبض' },
  'accounting/disbursements': { label: 'سندات الصرف' },
  'accounting/journals': { label: 'الدفاتر' },
  'accounting/journal-entries': { label: 'القيود المحاسبية' },
  'accounting/journal-items': { label: 'بنود القيد' },
  'accounting/chart-of-accounts': { label: 'دليل الحسابات' },
  'accounting/reporting': { label: 'التقارير المالية' },
  'accounting/returns': { label: 'المرتجعات' },
  'accounting/profit-loss': { label: 'أرباح وخسائر' },
  'accounting/price-lists': { label: 'قوائم الأسعار' },
  'accounting/analytic': { label: 'حسابات تحليلية' },
  'accounting/budgets': { label: 'الميزانيات' },
  hr: { label: 'الموارد البشرية' },
  'hr/employees': { label: 'الموظفين' },
  'hr/employees/new': { label: 'موظف جديد', listPath: 'hr/employees' },
  'hr/departments': { label: 'الأقسام' },
  'hr/contracts': { label: 'العقود' },
  'hr/payslips': { label: 'كشوف المرتبات' },
  settings: { label: 'الإعدادات' },
};

const LIST_PARENTS: Record<string, string> = {
  'inventory/products': 'المنتجات',
  'inventory/operations': 'العمليات',
  'inventory/lots': 'اللوتات / السيريال',
  'inventory/adjustments': 'تعديلات المخزون',
  'inventory/products/categories': 'فئات المنتجات',
  sales: 'المبيعات',
  purchases: 'المشتريات',
  contacts: 'جهات الاتصال',
  'accounting/invoices': 'فواتير العملاء',
  'accounting/bills': 'فواتير الشراء',
  'accounting/payments': 'المدفوعات',
  'accounting/journal-entries': 'القيود المحاسبية',
  'hr/employees': 'الموظفين',
};

function Breadcrumbs({ locale }: { locale: string }) {
  const pathname = usePathname();
  const routeLabels = useBreadcrumbsStore(s => s.routeLabels);
  const cleanPath = pathname.replace(`/${locale}/`, '').replace(`/${locale}`, '');
  if (!cleanPath || cleanPath === 'dashboard') return null;
  const items: { label: string; href: string; isLast: boolean }[] = [];
  const exactMatch = ROUTE_MAP[cleanPath];
  if (exactMatch) {
    if (exactMatch.listPath) {
      const parentRoute = ROUTE_MAP[exactMatch.listPath];
      if (parentRoute) {
        items.push({ label: parentRoute.label, href: `/${locale}/${exactMatch.listPath}`, isLast: false });
      }
    }
    items.push({ label: exactMatch.label, href: `/${locale}/${cleanPath}`, isLast: true });
  } else {
    const segments = cleanPath.split('/');
    const lastSegment = segments[segments.length - 1];
    const isRecord = lastSegment && lastSegment.length > 20;
    if (isRecord) {
      const parentPath = segments.slice(0, -1).join('/');
      const parentLabel = LIST_PARENTS[parentPath];
      if (parentLabel) {
        items.push({ label: parentLabel, href: `/${locale}/${parentPath}`, isLast: false });
      }
      const recordName = routeLabels[pathname] || 'سجل';
      items.push({ label: recordName, href: pathname, isLast: true });
    } else {
      let matched = false;
      for (let i = segments.length; i > 0; i--) {
        const testPath = segments.slice(0, i).join('/');
        const routeInfo = ROUTE_MAP[testPath];
        if (routeInfo) {
          items.push({ label: routeInfo.label, href: `/${locale}/${testPath}`, isLast: true });
          matched = true;
          break;
        }
      }
      if (!matched) {
        items.push({ label: lastSegment, href: pathname, isLast: true });
      }
    }
  }
  if (items.length === 0) return null;
  return (
    <nav className="flex items-center text-[13px]" aria-label="Breadcrumb">
      <ol className="inline-flex items-center gap-1">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <span className="text-gray-400 mx-1.5 font-medium">/</span>
            )}
            {item.isLast ? (
              <span className="font-bold text-gray-900">{item.label}</span>
            ) : (
              <Link href={item.href} className="text-gray-500 hover:text-blue-700 transition-colors font-medium">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
