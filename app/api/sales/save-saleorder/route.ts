import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, {
        status: 401
      });
    }
    const payload = await req.json();
    const id = payload.id;
    if (!id) {
      return NextResponse.json({
        error: 'Missing id'
      }, {
        status: 400
      });
    }
    ;
    const current = await prisma.saleOrder.findUnique({
      where: {
        id
      }
    });
    if (!current) {
      return NextResponse.json({
        error: 'Order not found'
      }, {
        status: 404
      });
    }
    const lines = payload.lines.map((line: any) => ({
      ...line,
      qty: new Decimal(line.qty || 0),
      price: new Decimal(line.price || 0),
      discount: new Decimal(line.discount || 0),
      tax: new Decimal(line.tax || 0)
    }));
    const amountUntaxed = lines.reduce((sum: Decimal, line: any) => {
      const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100)));
      return sum.plus(subtotal);
    }, new Decimal(0));
    const amountTotal = lines.reduce((sum: Decimal, line: any) => {
      const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100)));
      const taxAmount = subtotal.mul(line.tax.div(100));
      return sum.plus(subtotal).plus(taxAmount);
    }, new Decimal(0));
    await prisma.$transaction(async tx => {
      let partner = null;
      if (payload.customer) {
        partner = await tx.partner.findUnique({
          where: {
            id: payload.customer
          }
        }).catch(() => null);
      }
      await tx.saleOrder.update({
        where: {
          id
        },
        data: {
          partnerId: partner?.id || current.partnerId,
          priceListId: payload.priceListId || null,
          dateOrder: payload.date ? new Date(payload.date) : current.dateOrder,
          updatedById: session.userId,
          amountUntaxed: amountUntaxed,
          amountTotal: amountTotal,
          note: payload.note
        }
      });
      const existingLines = await tx.saleOrderLine.findMany({
        where: {
          orderId: id
        }
      });
      const existingLineIds = existingLines.map((l: any) => l.id);
      const incomingLineIds = payload.lines.map((l: any) => l.id).filter(Boolean);
      const linesToDelete = existingLineIds.filter((id: string) => !incomingLineIds.includes(id));
      if (linesToDelete.length > 0) {
        await tx.saleOrderLine.deleteMany({
          where: {
            id: {
              in: linesToDelete
            }
          }
        });
      }
      for (let i = 0; i < payload.lines.length; i++) {
        const line = payload.lines[i];
        const product = line.productId ? await tx.product.findUnique({
          where: {
            id: line.productId
          }
        }) : null;
        const qty = new Decimal(line.qty || 0);
        const price = new Decimal(line.price || 0);
        const discount = new Decimal(line.discount || 0);
        const subtotal = qty.mul(price).mul(new Decimal(1).minus(discount.div(100)));
        const isSecondary = line.unitSelection === 'secondary';
        const lineData = {
          productId: product ? product.id : undefined,
          name: line.description || product?.name || 'Product',
          sequence: (i + 1) * 10,
          quantity: qty,
          priceUnit: price,
          discount1: discount,
          priceSubtotal: subtotal,
          unitName: isSecondary ? product?.secondaryUom : product?.uom,
          secondaryQuantity: new Decimal(line.secondaryQty || 0),
          secondaryUnit: product?.hasSecondaryUnit ? product?.secondaryUom : null,
          appliedPriceListName: line.appliedPriceListName || null,
          taxRate: new Decimal(line.tax || 0)
        };
        if (line.id && existingLineIds.includes(line.id)) {
          await tx.saleOrderLine.update({
            where: {
              id: line.id
            },
            data: lineData
          });
        } else {
          await tx.saleOrderLine.create({
            data: {
              ...lineData,
              orderId: id
            }
          });
        }
      }
    });
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('[API save-saleorder] Error:', error);
    return NextResponse.json({
      error: error.message || 'Save failed'
    }, {
      status: 500
    });
  }
}