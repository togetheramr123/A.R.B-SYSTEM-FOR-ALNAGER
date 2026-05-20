"use server";
import { getSession } from "@/lib/auth";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma"; /** * Get real-time smart button data for a Sale Order. * Fetches actual counts of deliveries, invoices, and payments. */
export async function getSaleOrderSmartData(orderId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const [deliveries, invoiceCount, invoices] = await Promise.all([prisma.stockPicking.findMany({
    where: {
      saleOrderId: orderId,
      pickingType: {
        in: ["outgoing", "OUTGOING"]
      }
    },
    select: {
      id: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }), prisma.invoice.count({
    where: {
      saleOrderId: orderId
    }
  }), prisma.invoice.findMany({
    where: {
      saleOrderId: orderId
    },
    select: {
      id: true,
      amountTotal: true,
      amountResidual: true,
      state: true
    }
  })]);
  const deliveryCount = deliveries.length;
  const firstDeliveryId = deliveryCount > 0 ? deliveries[0].id : null;
  const firstInvoiceId = invoices.length > 0 ? invoices[0].id : null;
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amountTotal || 0), 0);
  const totalResidual = invoices.reduce((sum, inv) => sum + Number(inv.amountResidual || 0), 0);
  const paidCount = invoices.filter(inv => inv.state === "paid").length;
  return {
    deliveryCount,
    firstDeliveryId,
    invoiceCount,
    firstInvoiceId,
    paidCount,
    totalInvoiced,
    totalResidual
  };
} /** * Get real-time smart button data for a Purchase Order. * Fetches actual counts of receipts and bills. */
export async function getPurchaseOrderSmartData(orderId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const [receipts, billCount, bills] = await Promise.all([prisma.stockPicking.findMany({
    where: {
      purchaseOrderId: orderId,
      pickingType: {
        in: ["incoming", "INCOMING"]
      }
    },
    select: {
      id: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }), prisma.invoice.count({
    where: {
      purchaseOrderId: orderId
    }
  }), prisma.invoice.findMany({
    where: {
      purchaseOrderId: orderId
    },
    select: {
      id: true,
      amountTotal: true,
      amountResidual: true,
      state: true
    }
  })]);
  const receiptCount = receipts.length;
  const firstReceiptId = receiptCount > 0 ? receipts[0].id : null;
  const firstBillId = bills.length > 0 ? (bills[0] as any).id : null;
  const totalBilled = bills.reduce((sum, bill) => sum + Number(bill.amountTotal || 0), 0);
  const totalResidual = bills.reduce((sum, bill) => sum + Number(bill.amountResidual || 0), 0);
  return {
    receiptCount,
    firstReceiptId,
    billCount,
    firstBillId,
    totalBilled,
    totalResidual
  };
} /** * Get all available taxes for a given scope (sale/purchase). */
export async function getTaxesByScope(scope: "sale" | "purchase") {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const taxes = await prisma.tax.findMany({
    where: {
      active: true,
      OR: [{
        taxScope: scope
      }, {
        taxScope: "none"
      }]
    },
    orderBy: {
      sequence: "asc"
    },
    select: {
      id: true,
      name: true,
      amount: true,
      amountType: true,
      priceInclude: true,
      description: true
    }
  });
  return taxes.map(t => ({
    ...t,
    amount: t.amount ? Number(t.amount.toString()) : 0
  }));
} /** * Get all payment terms. */
export async function getPaymentTerms() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return prisma.paymentTerm.findMany({
    where: {
      active: true
    },
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });
}