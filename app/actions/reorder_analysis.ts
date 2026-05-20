"use server";

import prisma from '@/lib/prisma';
export interface ReorderAnalysisRow {
  productId: string;
  productName: string;
  sku: string | null;
  uom: string;
  hasSecondaryUnit: boolean;
  secondaryUom: string | null;
  secondaryUomFactor: number;
  currentStock: number;
  currentStockCartons: number;
  totalSold: number;
  avgDailySales: number;
  reorderLevel: number;
  reorderLevelCartons: number;
  deficit: number;
  deficitCartons: number;
  status: string;
}
export async function getReorderAnalysis(days: number = 30): Promise<ReorderAnalysisRow[]> {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    const salesLines = await prisma.invoiceLine.findMany({
      where: {
        invoice: {
          type: 'out_invoice',
          state: 'posted',
          dateInvoice: {
            gte: startDate,
            lte: now
          }
        },
        productId: {
          not: null
        }
      },
      select: {
        productId: true,
        quantity: true
      }
    });
    const salesMap = new Map<string, number>();
    for (const line of salesLines) {
      if (!line.productId) continue;
      const prev = salesMap.get(line.productId) || 0;
      salesMap.set(line.productId, prev + Number(line.quantity));
    }
    const products = await prisma.product.findMany({
      where: {
        type: {
          in: ['storable', 'product']
        },
        active: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        uom: true,
        hasSecondaryUnit: true,
        secondaryUom: true,
        secondaryUomFactor: true
      }
    });
    const quants = await prisma.stockQuant.findMany({
      where: {
        location: {
          type: 'internal'
        }
      },
      select: {
        productId: true,
        quantity: true
      }
    });
    const stockMap = new Map<string, number>();
    for (const q of quants) {
      const prev = stockMap.get(q.productId) || 0;
      stockMap.set(q.productId, prev + Number(q.quantity));
    }
    const rows: ReorderAnalysisRow[] = [];
    for (const product of products) {
      const totalSold = salesMap.get(product.id) || 0;
      const avgDailySales = days > 0 ? totalSold / days : 0;
      const reorderLevel = Math.ceil(avgDailySales * 60);
      const currentStock = stockMap.get(product.id) || 0;
      const deficit = Math.max(0, reorderLevel - currentStock);
      const factor = Number(product.secondaryUomFactor) || 1;
      const currentStockCartons = product.hasSecondaryUnit ? Math.floor(currentStock / factor) : 0;
      const reorderLevelCartons = product.hasSecondaryUnit ? Math.ceil(reorderLevel / factor) : 0;
      const deficitCartons = product.hasSecondaryUnit ? Math.ceil(deficit / factor) : 0;
      let status: 'ok' | 'low' | 'critical' = 'ok';
      if (reorderLevel > 0) {
        const ratio = currentStock / reorderLevel;
        if (ratio <= 0.3) status = 'critical';else if (ratio <= 0.7) status = 'low';
      } else if (currentStock <= 0 && totalSold > 0) {
        status = 'critical';
      }
      rows.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        uom: product.uom,
        hasSecondaryUnit: product.hasSecondaryUnit,
        secondaryUom: product.secondaryUom,
        secondaryUomFactor: factor,
        currentStock,
        currentStockCartons,
        totalSold,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        reorderLevel,
        reorderLevelCartons,
        deficit,
        deficitCartons,
        status
      });
    }
    rows.sort((a: any, b: any) => {
      const statusOrder: any = {
        critical: 0,
        low: 1,
        ok: 2
      };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.deficit - a.deficit;
    });
    return rows;
  } catch (error) {
    console.error('Failed to get reorder analysis:', error);
    return [];
  }
}