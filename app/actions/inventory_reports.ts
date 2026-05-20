"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export async function getInventoryShortagesReport(forecastMonths: number) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session?.companyId) return [];
  const products = await prisma.product.findMany({
    where: {
      type: 'storable',
      companyId: session.companyId,
      active: true
    },
    include: {
      stockQuants: {
        where: {
          location: {
            type: 'internal'
          }
        }
      }
    }
  });
  const now = new Date();
  const periodMonths = forecastMonths > 0 ? forecastMonths : 1;
  const targetDate = new Date(now.getFullYear(), now.getMonth() - periodMonths, now.getDate());
  const salesInvoiceLines = await prisma.invoiceLine.findMany({
    where: {
      invoice: {
        state: {
          in: ['posted', 'paid']
        },
        type: 'out_invoice',
        companyId: session.companyId,
        dateInvoice: {
          gte: targetDate
        }
      }
    }
  });
  const purchaseInvoiceLines = await prisma.invoiceLine.findMany({
    where: {
      invoice: {
        state: {
          in: ['posted', 'paid']
        },
        type: 'in_invoice',
        companyId: session.companyId,
        dateInvoice: {
          gte: targetDate
        }
      }
    }
  });
  const salesByProduct: Record<string, number> = {};
  salesInvoiceLines.forEach(line => {
    if (line.productId) {
      salesByProduct[line.productId] = (salesByProduct[line.productId] || 0) + Number(line.quantity || 0);
    }
  });
  const purchasesByProduct: Record<string, number> = {};
  purchaseInvoiceLines.forEach(line => {
    if (line.productId) {
      purchasesByProduct[line.productId] = (purchasesByProduct[line.productId] || 0) + Number(line.quantity || 0);
    }
  });
  const reportData = [];
  for (const product of products) {
    const currentStock = product.stockQuants.reduce((sum, q) => sum + Number(q.quantity || 0), 0);
    const totalSalesInPeriod = salesByProduct[product.id] || 0;
    const totalPurchasesInPeriod = purchasesByProduct[product.id] || 0;
    const avgMonthlySales = totalSalesInPeriod / periodMonths;
    if (totalSalesInPeriod <= 0) {
      continue;
    }
    const forecastedConsumption = avgMonthlySales * forecastMonths;
    const reorderPoint = 0;
    let ruleApplied = null;
    let shortage = 0;
    const isFastMoving = totalPurchasesInPeriod > 0 && totalSalesInPeriod >= totalPurchasesInPeriod * 0.5;
    if (isFastMoving) {
      ruleApplied = '⚡ سريع الدوران (مبيعات >= 50% من مشتريات الفترة)';
      if (shortage <= 0) shortage = totalPurchasesInPeriod;
      's moving fast } نفاد المخزون (Out of Stock)';
      shortage = forecastMonths > 0 ? forecastedConsumption : avgMonthlySales;
    } else if (currentStock <= reorderPoint && reorderPoint > 0) {
      ruleApplied = 'تحت الحد الأدنى (Below Min)';
      shortage = reorderPoint - currentStock + forecastedConsumption;
    } else if (forecastMonths > 0 && currentStock < forecastedConsumption) {
      ruleApplied = `تنبؤ: استهلاك ${forecastMonths} شهر`;
      shortage = forecastedConsumption - currentStock;
    }
    if (ruleApplied) {
      // Calculate cartons
      const factor = Number(product.secondaryUomFactor) || 1;
      const shortageCartons = factor > 0 ? shortage / factor : 0;
      reportData.push({
        id: product.id,
        name: product.name,
        code: product.sku || product.barcode || '-',
        currentStock,
        avgMonthlySales: parseFloat(avgMonthlySales.toFixed(2)),
        forecastedConsumption: parseFloat(forecastedConsumption.toFixed(2)),
        shortage: parseFloat(shortage.toFixed(2)),
        shortageCartons: parseFloat(shortageCartons.toFixed(2)),
        ruleApplied,
        secondaryUom: product.secondaryUom || 'كرتونة'
      });
    }
  } // Sort by largest shortage
  return reportData.sort((a, b) => b.shortage - a.shortage);
}
export async function createPoFromShortages(items: {
  productId: string;
  quantity: number;
  priceUnit: number;
}[]) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session?.companyId || !session?.userId) throw new Error('Unauthorized');
  if (!items || items.length === 0) throw new Error('لا توجد أصناف لإنشاء أمر الشراء'); // Fetch default supplier
  // In our PurchaseOrder schema, partnerId is usually required. Let's find any supplier or just use a generic one
  const partner = await prisma.partner.findFirst({
    where: {
      companyId: session.companyId,
      isVendor: true
    }
  });
  if (!partner) {
    throw new Error('يرجى إضافة مورد (Supplier) واحد على الأقل في النظام قبل إنشاء أمر الشراء');
  }
  const linesToCreate: any[] = [];
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: {
        id: item.productId
      }
    });
    if (!product) continue;
    linesToCreate.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      priceUnit: Number(product.costPrice || 0),
      priceSubtotal: Number(product.costPrice || 0) * item.quantity
    });
  }
  const totalAmount = linesToCreate.reduce((sum, line) => sum + line.priceSubtotal, 0);
  
  const po = await prisma.purchaseOrder.create({
    data: {
      name: `PO/SHORTAGE/${new Date().getTime()}`,
      partnerId: partner.id,
      dateOrder: new Date(),
      
      companyId: session.companyId,
      createdById: session.userId,
      amountUntaxed: totalAmount,
      amountTotal: totalAmount,
      lines: {
        create: linesToCreate
      }
    }
  });
  return { success: true, id: po.id };
}