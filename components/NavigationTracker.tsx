'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTabStore, buildTabTitle, getTabIcon } from '@/store/tabStore';
import { useBreadcrumbsStore } from '@/store/breadcrumbsStore';
import { useBreadcrumbStore } from '@/hooks/useBreadcrumbStore';
export function NavigationTracker({
  locale
}: {
  locale: string;
}) {
  const pathname = usePathname();
  const addTab = useTabStore(s => s.addTab);
  const tabs = useTabStore(s => s.tabs);
  const routeLabels = useBreadcrumbsStore(s => s.routeLabels);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const dashboardPath = `/${locale}/dashboard`;
      const hasDashboard = tabs.some(t => t.path.includes('/dashboard'));
      if (!hasDashboard) {
        addTab({
          path: dashboardPath,
          title: 'لوحة التحكم',
          icon: '🏠',
          pinned: true
        });
      }
    }
  }, [locale, addTab, tabs]);
  
  useEffect(() => {
    if (!pathname) return;
    if (pathname.includes('/login')) return;
    if (pathname.includes('/dashboard')) {
      useBreadcrumbStore.getState().reset();
      return;
    }
    const segments = pathname.split('/').filter(Boolean);
    const moduleSegment = segments[1];
    let title = routeLabels[pathname] || buildTabTitle(pathname);
    const icon = getTabIcon(pathname);
    
    const lastSegment = segments[segments.length - 1];
    const isRecordPage = lastSegment && lastSegment.length > 20;
    if (isRecordPage) {
      const dynamicLabel = routeLabels[pathname];
      if (dynamicLabel) {
        title = dynamicLabel;
      } else {
        const parentSeg = segments[segments.length - 2];
        const parentLabel = getParentLabel(parentSeg);
        title = parentLabel ? `${parentLabel}` : 'سجل';
      }
    }
    const isPinned = pathname.includes('/dashboard');
    
    let breadcrumbLabel = title;
    if (segments.length > 2 && title.includes(' / ')) {
      breadcrumbLabel = title.split(' / ').pop() || title;
    }
    useBreadcrumbStore.getState().push({
      id: pathname,
      label: breadcrumbLabel,
      href: pathname
    });
  }, [pathname, routeLabels]);

  return null;
}
function getParentLabel(segment: string): string | null {
  const labels: Record<string, string> = {
    products: 'منتج',
    contacts: 'جهة اتصال',
    invoices: 'فاتورة',
    bills: 'فاتورة شراء',
    purchases: 'أمر شراء',
    sales: 'أمر بيع',
    employees: 'موظف',
    operations: 'عملية',
    lots: 'لوت',
    payments: 'دفعة',
    receipts: 'إيصال استلام',
    deliveries: 'أمر توصيل',
    transfers: 'تحويل'
  };
  return labels[segment] || null;
}