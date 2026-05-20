"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
export interface YearStats {
  year: number;
  invoicesCount: number;
  openInvoicesCount: number;
  salesCount: number;
  purchasesCount: number;
  stockMovesCount: number;
  openStockMovesCount: number;
  isOldest: boolean;
  canArchive: boolean;
}
export async function getDatabaseStatsByYear(): Promise<YearStats[]> {
  var session = await getSession();
  if (!session) return [];
  const [invoices, sales, purchases, stockMoves] = await Promise.all([prisma.invoice.findMany({
    select: {
      id: true,
      dateInvoice: true,
      state: true
    }
  }), prisma.saleOrder.findMany({
    select: {
      id: true,
      dateOrder: true
    }
  }), prisma.purchaseOrder.findMany({
    select: {
      id: true,
      dateOrder: true
    }
  }), prisma.stockMove.findMany({
    select: {
      id: true,
      date: true,
      status: true
    }
  })]);
  const statsMap = new Map<number, any>();
  const getYear = (date: Date | string | null | undefined) => {
    if (!date) return null;
    return new Date(date).getFullYear();
  };
  const registerYear = (year: number) => {
    if (!statsMap.has(year)) {
      statsMap.set(year, {
        year,
        invoicesCount: 0,
        openInvoicesCount: 0,
        salesCount: 0,
        purchasesCount: 0,
        stockMovesCount: 0,
        openStockMovesCount: 0
      });
    }
    return statsMap.get(year);
  };
  invoices.forEach(inv => {
    const y = getYear(inv.dateInvoice);
    if (y) {
      const yData = registerYear(y);
      yData.invoicesCount++;
      if (inv.state === 'draft' || inv.state !== 'paid') {
        yData.openInvoicesCount++;
      }
    }
  });
  sales.forEach(sale => {
    const y = getYear(sale.dateOrder);
    if (y) registerYear(y).salesCount++;
  });
  purchases.forEach(po => {
    const y = getYear(po.dateOrder);
    if (y) registerYear(y).purchasesCount++;
  });
  stockMoves.forEach(sm => {
    const y = getYear(sm.date);
    if (y) {
      const yData = registerYear(y);
      yData.stockMovesCount++;
      if (['draft', 'waiting', 'confirmed', 'assigned'].includes(sm.status)) {
        yData.openStockMovesCount++;
      }
    }
  });
  const results: YearStats[] = Array.from(statsMap.values()).sort((a, b) => a.year - b.year);
  if (results.length > 0) {
    results[0].isOldest = true;
    results.forEach((r, idx) => {
      r.isOldest = idx === 0;
      r.canArchive = r.isOldest && r.openInvoicesCount === 0 && r.openStockMovesCount === 0;
    });
  }
  return results;
}
export async function checkArchiveEligibility(year: number) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const stats = await getDatabaseStatsByYear();
  const yearStat = stats.find(s => s.year === year);
  if (!yearStat) return {
    eligible: false,
    message: 'السنة غير موجودة.'
  };
  if (!yearStat.isOldest) {
    return {
      eligible: false,
      message: 'لا يمكن أرشفة هذه السنة إلا بعد أرشفة السنوات الأقدم أولاً.'
    };
  }
  if (yearStat.openInvoicesCount > 0) {
    return {
      eligible: false,
      message: `يوجد ${yearStat.openInvoicesCount} فواتير أو قيود مفتوحة/مبدئية في هذا العام. يجب تقفيلها أولاً.`
    };
  }
  if (yearStat.openStockMovesCount > 0) {
    return {
      eligible: false,
      message: `يوجد ${yearStat.openStockMovesCount} حركات مخزنية غير منتهية في هذا العام. يجب تقفيلها أولاً.`
    };
  }
  return {
    eligible: true,
    message: 'مؤهل للأرشفة'
  };
}
export async function mockArchiveYear(year: number) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const eligibility = await checkArchiveEligibility(year);
  if (!eligibility.eligible) {
    throw new Error(eligibility.message);
  }
  {
    year;
  }
  {
    year + 1;
  }
  new Promise(resolve => setTimeout(resolve, 3000));
  return {
    success: true,
    message: `تمت الدورة المستندية لأرشفة ومسح بيانات سنة ${year} بنجاح، وتم ترحيل الأرصدة كقيد افتتاحي لعام ${year + 1}.`
  };
}
export async function getDatabaseStorageStats() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return null;
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    let fileSizeMB = 0;
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      fileSizeMB = stats.size / (1024 * 1024);
    }
    const [sales, purchases, inventory, accounting, contacts] = await Promise.all([Promise.all([prisma.saleOrder.count(), prisma.saleOrderLine.count()]), Promise.all([prisma.purchaseOrder.count(), prisma.purchaseOrderLine.count()]), Promise.all([prisma.stockPicking.count(), prisma.stockMove.count(), prisma.stockQuant.count()]), Promise.all([prisma.invoice.count(), prisma.journalEntry.count(), prisma.payment.count()]), Promise.all([prisma.partner.count(), prisma.user.count()])]);
    return {
      totalSizeMB: fileSizeMB,
      sections: {
        sales: {
          label: 'المبيعات (Sales)',
          records: sales[0] + sales[1],
          color: 'text-emerald-500',
          bg: 'bg-emerald-50'
        },
        purchases: {
          label: 'المشتريات (Purchases)',
          records: purchases[0] + purchases[1],
          color: 'text-amber-500',
          bg: 'bg-amber-50'
        },
        inventory: {
          label: 'المخزون (Inventory)',
          records: inventory[0] + inventory[1] + inventory[2],
          color: 'text-blue-500',
          bg: 'bg-blue-50'
        },
        accounting: {
          label: 'الحسابات (Accounting)',
          records: accounting[0] + accounting[1] + accounting[2],
          color: 'text-purple-500',
          bg: 'bg-purple-50'
        },
        contacts: {
          label: 'جهات الاتصال (Contacts)',
          records: contacts[0] + contacts[1],
          color: 'text-slate-500',
          bg: 'bg-slate-50'
        }
      }
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}