"use server";
import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
export interface Notification {
  id: string;
  type: "overdue_invoice" | "low_stock" | "expiring_quotation" | "expiring_rfq";
  title: string;
  message: string;
  severity: "warning" | "danger" | "info";
  link: string;
  date: string;
}
const RFQ_EXPIRY_DAYS = 14; // عدد الأيام قبل اعتبار طلب عرض السعر منتهي الصلاحية /** * Get all active notifications: * 1. Overdue invoices (dateDue < today && state = 'posted') * 2. Low stock products (onHand <= reorderLevel) */
export async function getNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  try {
    // 1. Overdue Invoices
    const now = new Date();
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        state: "posted",
        dateDue: {
          lt: now
        }
      },
      include: {
        partner: true
      },
      orderBy: {
        dateDue: "asc"
      },
      take: 20
    });
    for (const inv of overdueInvoices) {
      const daysOverdue = Math.ceil((now.getTime() - new Date(inv.dateDue!).getTime()) / (1000 * 60 * 60 * 24));
      const residual = Number(inv.amountResidual);
      if (residual <= 0) continue;
      notifications.push({
        id: `inv-${inv.id}`,
        type: "overdue_invoice",
        title: `فاتورة متأخرة: ${inv.name}`,
        message: `${inv.partner?.name || "—"} — متأخرة ${daysOverdue} يوم — المتبقي: ${residual.toFixed(2)} ج.م`,
        severity: daysOverdue > 30 ? "danger" : "warning",
        link: `/ar/accounting/invoices/${inv.id}`,
        date: new Date(inv.dateDue!).toISOString()
      });
    } // 2. Low Stock Products (products with onHand <= 5 as default reorder level);
    const products = await prisma.product.findMany({
      where: {
        type: "storable",
        active: true
      },
      include: {
        stockQuants: {
          where: {
            location: {
              type: "internal"
            }
          }
        }
      }
    });
    for (const product of products) {
      const totalOnHand = product.stockQuants.reduce((sum, q) => sum + Number(q.quantity), 0); // Use a default reorder level of 5 (can be customized later with a field);
      const reorderLevel = 5;
      if (totalOnHand <= reorderLevel && totalOnHand >= 0) {
        notifications.push({
          id: `stock-${product.id}`,
          type: "low_stock",
          title: `مخزون منخفض: ${product.name}`,
          message: `الكمية المتاحة: ${totalOnHand} ${product.uom} — حد إعادة الطلب: ${reorderLevel}`,
          severity: totalOnHand <= 0 ? "danger" : "warning",
          link: `/ar/inventory/products/${product.id}`,
          date: new Date().toISOString()
        });
      }
    } // 3. Expiring Sale Quotations (عروض أسعار بيع تقترب من انتهاء الصلاحية);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringQuotations = await prisma.saleOrder.findMany({
      where: {
        status: "draft",
        validityDate: {
          not: null,
          lte: threeDaysFromNow
        }
      },
      include: {
        partner: true
      },
      take: 20
    });
    for (const quote of expiringQuotations) {
      const validityDate = new Date(quote.validityDate!);
      const isExpired = validityDate < now;
      const daysLeft = Math.ceil((validityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `quote-${quote.id}`,
        type: "expiring_quotation",
        title: isExpired ? `عرض سعر منتهي: ${quote.name}` : `عرض سعر ينتهي قريباً: ${quote.name}`,
        message: isExpired ? `${quote.partner?.name || "—"} — انتهت الصلاحية — المبلغ: ${Number(quote.amountTotal).toFixed(2)} ج.م` : `${quote.partner?.name || "—"} — يتبقى ${daysLeft} يوم — المبلغ: ${Number(quote.amountTotal).toFixed(2)} ج.م`,
        severity: isExpired ? "danger" : "warning",
        link: `/ar/sales/${quote.id}`,
        date: validityDate.toISOString()
      });
    } // 4. Stale Purchase RFQs (طلبات عروض أسعار شراء لم تُعتمد بعد 14 يوم);
    const rfqExpiryDate = new Date(now.getTime() - RFQ_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const staleRFQs = await prisma.purchaseOrder.findMany({
      where: {
        status: "draft",
        dateOrder: {
          lte: rfqExpiryDate
        }
      },
      include: {
        partner: true
      },
      take: 20
    });
    for (const rfq of staleRFQs) {
      const daysOld = Math.ceil((now.getTime() - new Date(rfq.dateOrder).getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `rfq-${rfq.id}`,
        type: "expiring_rfq",
        title: `طلب عرض سعر متأخر: ${rfq.name}`,
        message: `${rfq.partner?.name || "—"} — ${daysOld} يوم بدون اعتماد — المبلغ: ${Number(rfq.amountTotal).toFixed(2)} ج.م`,
        severity: daysOld > 30 ? "danger" : "warning",
        link: `/ar/purchases/${rfq.id}`,
        date: new Date(rfq.dateOrder).toISOString()
      });
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  } // Sort by severity (danger first) then by date
  return notifications.sort((a, b) => {
    if (a.severity === "danger" && b.severity !== "danger") return -1;
    if (b.severity === "danger" && a.severity !== "danger") return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
} /** * Dashboard data aggregation */
export async function getDashboardData(companyId?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("notification", "read");

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const whereClause = companyId ? {
      companyId
    } : {}; // 1. Invoice counts
    const [draftInvoices, unpaidInvoices, overdueInvoices, draftBills, unpaidBills] = await Promise.all([prisma.invoice.count({
      where: {
        type: "out_invoice",
        state: "draft",
        ...whereClause
      }
    }), prisma.invoice.count({
      where: {
        type: "out_invoice",
        state: "posted",
        ...whereClause
      }
    }), prisma.invoice.count({
      where: {
        type: "out_invoice",
        state: "posted",
        dateDue: {
          lt: now
        },
        ...whereClause
      }
    }), prisma.invoice.count({
      where: {
        type: "in_invoice",
        state: "draft",
        ...whereClause
      }
    }), prisma.invoice.count({
      where: {
        type: "in_invoice",
        state: "posted",
        ...whereClause
      }
    })]); // 2. Top 5 Debtors (Partners with highest receivable balance);
    const receivableItems = await prisma.journalItem.findMany({
      where: {
        ...whereClause,
        account: {
          type: "receivable"
        },
        entry: {
          state: "posted"
        }
      },
      include: {
        entry: {
          include: {
            partner: true
          }
        }
      }
    });
    const debtorMap = new Map<string, {
      name: string;
      balance: number;
    }>();
    for (const item of receivableItems) {
      const partner = item.entry.partner;
      if (!partner) continue;
      const current = debtorMap.get(partner.id) || {
        name: partner.name,
        balance: 0
      };
      current.balance += Number(item.debit) - Number(item.credit);
      debtorMap.set(partner.id, current);
    }
    const topDebtors = Array.from(debtorMap.values()).filter(d => d.balance > 0.01).sort((a, b) => b.balance - a.balance).slice(0, 5); // 3. Monthly Cash Flow
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        ...whereClause,
        state: "posted",
        date: {
          gte: startOfMonth
        }
      }
    });
    const totalReceipts = monthlyPayments.filter(p => p.paymentType === "inbound").reduce((sum, p) => sum + Number(p.amount), 0);
    const totalDisbursements = monthlyPayments.filter(p => p.paymentType === "outbound").reduce((sum, p) => sum + Number(p.amount), 0); // 4. Total Overdue Amount
    const overdueInvoicesList = await prisma.invoice.findMany({
      where: {
        type: "out_invoice",
        state: "posted",
        dateDue: {
          lt: now
        },
        ...whereClause
      }
    });
    const totalOverdueAmount = overdueInvoicesList.reduce((sum, inv) => sum + Number(inv.amountResidual), 0); // 5. Monthly Revenue & Expenses
    const incomeItems = await prisma.journalItem.aggregate({
      where: {
        ...whereClause,
        account: {
          type: {
            in: ["income", "other_income"]
          }
        },
        entry: {
          state: "posted",
          date: {
            gte: startOfMonth
          }
        }
      },
      _sum: {
        credit: true,
        debit: true
      }
    });
    const expenseItems = await prisma.journalItem.aggregate({
      where: {
        ...whereClause,
        account: {
          type: {
            in: ["expense", "cost_of_revenue"]
          }
        },
        entry: {
          state: "posted",
          date: {
            gte: startOfMonth
          }
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    const monthlyRevenue = Number(incomeItems._sum.credit || 0) - Number(incomeItems._sum.debit || 0);
    const monthlyExpenses = Number(expenseItems._sum.debit || 0) - Number(expenseItems._sum.credit || 0);
    return {
      draftInvoices,
      unpaidInvoices,
      overdueInvoices,
      draftBills,
      unpaidBills,
      topDebtors,
      totalReceipts,
      totalDisbursements,
      totalOverdueAmount,
      monthlyRevenue,
      monthlyExpenses,
      netCashFlow: totalReceipts - totalDisbursements
    };
  } catch (error) {
    console.error("Failed to get dashboard data:", error);
    return {
      draftInvoices: 0,
      unpaidInvoices: 0,
      overdueInvoices: 0,
      draftBills: 0,
      unpaidBills: 0,
      topDebtors: [],
      totalReceipts: 0,
      totalDisbursements: 0,
      totalOverdueAmount: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      netCashFlow: 0
    };
  }
}