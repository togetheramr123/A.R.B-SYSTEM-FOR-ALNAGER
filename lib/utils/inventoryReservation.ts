import { Decimal } from '@prisma/client/runtime/library';

export async function reserveStock(tx: any, companyId: string, productId: string, locationId: string, qtyToReserve: Decimal): Promise<Decimal> {
  if (qtyToReserve.lte(0)) return new Decimal(0);
  const quant = await tx.stockQuant.findFirst({
    where: { companyId, productId, locationId }
  });
  if (!quant) return new Decimal(0);
  const availableToReserve = new Decimal(quant.quantity).minus(new Decimal(quant.reservedQty));
  if (availableToReserve.lte(0)) return new Decimal(0);
  const actualReservation = Decimal.min(availableToReserve, qtyToReserve);
  await tx.stockQuant.update({
    where: { id: quant.id },
    data: { reservedQty: new Decimal(quant.reservedQty).plus(actualReservation) }
  });
  return actualReservation;
}

export async function releaseReservedStock(tx: any, companyId: string, productId: string, locationId: string, qtyToRelease: Decimal): Promise<void> {
  if (qtyToRelease.lte(0)) return;
  const quant = await tx.stockQuant.findFirst({
    where: { companyId, productId, locationId }
  });
  if (!quant) return;
  const newReservedQty = Decimal.max(0, new Decimal(quant.reservedQty).minus(qtyToRelease));
  await tx.stockQuant.update({
    where: { id: quant.id },
    data: { reservedQty: newReservedQty }
  });
}
