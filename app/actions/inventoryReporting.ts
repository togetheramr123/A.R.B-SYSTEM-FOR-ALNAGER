"use server";
import { ensureAccess } from '@/lib/access';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getStockShortageReport(fromDate?: string, toDate?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];

  let dateFilter: any = {};
  if (fromDate || toDate) {
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
  }

  const products = await prisma.product.findMany({
    where: {
      type: 'storable',
      active: true,
      ...(session.companyId ? { companyId: session.companyId } : {}),
    },
    include: {
      replenishments: true,
      stockQuants: { where: { location: { type: 'internal' } } },
    },
  });

  const pendingMoves = await prisma.stockMove.findMany({
    where: {
      status: { notIn: ['done', 'cancel', 'draft'] },
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      ...(session.companyId ? { companyId: session.companyId } : {}),
    },
    include: {
      destLocation: { select: { type: true } },
      sourceLocation: { select: { type: true } },
    },
  });

  const incomingByProduct = new Map<string, number>();
  const outgoingByProduct = new Map<string, number>();

  for (const move of pendingMoves) {
    if (!move.productId) continue;
    const qty = Number(move.quantity) - Number(move.quantityDone);
    if (qty <= 0) continue;
    const isIncoming = move.destLocation?.type === 'internal' && move.sourceLocation?.type !== 'internal';
    const isOutgoing = move.sourceLocation?.type === 'internal' && move.destLocation?.type !== 'internal';
    if (isIncoming) {
      incomingByProduct.set(move.productId, (incomingByProduct.get(move.productId) || 0) + qty);
    } else if (isOutgoing) {
      outgoingByProduct.set(move.productId, (outgoingByProduct.get(move.productId) || 0) + qty);
    }
  }

  const report: any[] = [];

  for (const product of products) {
    const onHand = product.stockQuants.reduce((sum, q) => sum + Number(q.quantity), 0);
    const incoming = incomingByProduct.get(product.id) || 0;
    const outgoing = outgoingByProduct.get(product.id) || 0;
    const forecasted = onHand + incoming - outgoing;

    let minQty = 0;
    let maxQty = 0;

    if (product.replenishments.length > 0) {
      const rule = product.replenishments[0];
      minQty = Number(rule.minQty);
      maxQty = Number(rule.maxQty);
    }

    if (forecasted <= minQty) {
      const reorderAmount = maxQty > 0 ? (maxQty - forecasted) : (minQty - forecasted);
      const toOrder = Math.max(reorderAmount, 0);
      report.push({
        productId: product.id,
        productCode: product.internalReference || product.sku || '',
        productName: product.name,
        onHand,
        incoming,
        outgoing,
        forecasted,
        minQty,
        maxQty,
        toOrder: toOrder === 0 && forecasted < 0 ? Math.abs(forecasted) : toOrder,
      });
    }
  }

  return report.sort((a, b) => a.forecasted - b.forecasted);
}
