"use server";
import { getSession } from "@/lib/auth";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
export async function getQuoteAvailabilityReport(productIds: string[]) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (!productIds || productIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    },
    select: {
      id: true,
      name: true,
      stockQuants: {
        select: {
          quantity: true
        }
      },
      uom: true,
      secondaryUom: true,
      hasSecondaryUnit: true,
      secondaryUomFactor: true
    }
  });
  const assignedMoves = await prisma.stockMove.findMany({
    where: {
      productId: {
        in: productIds
      }
    },
    include: { picking: { include: { partner: true, saleOrder: { include: { partner: true } } } } }
  });
  const reportData = products.map(product => {
    const movesForProduct = assignedMoves.filter(m => m.productId === product.id);
    const totalReserved = movesForProduct.reduce((acc, move) => acc + Number(move.quantity || 0), 0);
    const reservations = movesForProduct.map(move => {
      const partnerName = (move as any).picking?.partner?.name || ((move as any).picking?.saleOrder as any)?.partner?.name || 'غير معروف';
      const date = (move as any).picking?.scheduledDate || (move as any).picking?.createdAt || move.date;
      return {
        id: move.id,
        partnerName,
        date: date ? new Date(date).toISOString().split('T')[0] : 'غير محدد',
        quantity: Number(move.quantity || 0)
      };
    });
    const physicalStock = product.stockQuants?.reduce((acc: number, sq: any) => acc + Number(sq.quantity || 0), 0) || 0;
    const availableStock = Math.max(0, physicalStock - totalReserved);
    return {
      productId: product.id,
      productName: product.name,
      uom: product.uom,
      secondaryUom: product.secondaryUom,
      hasSecondaryUnit: product.hasSecondaryUnit,
      secondaryUomFactor: Number(product.secondaryUomFactor || 1),
      physicalStock,
      totalReserved,
      availableStock,
      reservations
    };
  });
  return reportData;
}