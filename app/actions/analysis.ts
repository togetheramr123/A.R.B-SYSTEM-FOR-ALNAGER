"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export async function getProductSales(productId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    data: [],
    productName: ''
  };
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true }
    });
    
    const soLines = await prisma.saleOrderLine.findMany({
      where: {
        productId: productId,
        order: { companyId: session.companyId }
      },
      include: {
        order: { include: { partner: true } }
      },
      orderBy: { order: { dateOrder: 'desc' } }
    });
    
    const invLines = await prisma.invoiceLine.findMany({
      where: {
        productId: productId,
        invoice: { type: 'out_invoice', companyId: session.companyId }
      },
      include: {
        invoice: { include: { partner: true } }
      },
      orderBy: { invoice: { dateInvoice: 'desc' } }
    });

    const data: any[] = [];
    soLines.forEach((line: any) => {
      data.push({
        id: `so-${line.id}`,
        date: line.order.dateOrder,
        order_ref: line.order.name,
        partner_name: line.order.partner?.name || 'عميل غير معروف',
        quantity: Number(line.quantity),
        price_unit: Number(line.priceUnit),
        price_subtotal: Number(line.priceSubtotal),
        status: line.order.status
      });
    });
    
    invLines.forEach((line: any) => {
      data.push({
        id: `inv-${line.id}`,
        date: line.invoice.dateInvoice,
        order_ref: line.invoice.name,
        partner_name: line.invoice.partner?.name || 'عميل غير معروف',
        quantity: Number(line.quantity),
        price_unit: Number(line.priceUnit),
        price_subtotal: Number(line.priceSubtotal),
        status: line.invoice.state === 'draft' ? 'draft' : line.invoice.state === 'posted' ? 'done' : 'cancel'
      });
    });

    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { data, productName: product?.name || 'Unknown Product' };
  } catch (error) {
    console.error("Error fetching product sales:", error);
    return { data: [], productName: '' };
  }
}
export async function getProductPurchases(productId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    data: [],
    productName: ''
  };
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        name: true
      }
    });
    const poLines = await prisma.purchaseOrderLine.findMany({
      where: {
        productId: productId,
        order: {
          companyId: session.companyId
        }
      },
      include: {
        order: {
          include: {
            partner: true
          }
        }
      },
      orderBy: {
        order: {
          dateOrder: 'desc'
        }
      }
    });
    const billLines = await prisma.invoiceLine.findMany({
      where: {
        productId: productId,
        invoice: {
          type: 'in_invoice',
          companyId: session.companyId
        }
      },
      include: {
        invoice: {
          include: {
            partner: true
          }
        }
      },
      orderBy: {
        invoice: {
          dateInvoice: 'desc'
        }
      }
    });
    const data: any[] = [];
    poLines.forEach((line: any) => {
      data.push({
        id: `po-${line.id}`,
        date: line.order.dateOrder,
        order_ref: line.order.name,
        partner_name: line.order.partner?.name || 'مورد غير معروف',
        quantity: Number(line.quantity),
        price_unit: Number(line.priceUnit),
        price_subtotal: Number(line.priceSubtotal),
        status: line.order.status
      });
    });
    billLines.forEach((line: any) => {
      data.push({
        id: `bill-${line.id}`,
        date: line.invoice.dateInvoice,
        order_ref: line.invoice.name,
        partner_name: line.invoice.partner?.name || 'مورد غير معروف',
        quantity: Number(line.quantity),
        price_unit: Number(line.priceUnit),
        price_subtotal: Number(line.priceSubtotal),
        status: line.invoice.state === 'draft' ? 'draft' : line.invoice.state === 'posted' ? 'done' : 'cancel'
      });
    });
    ;
    return {
      data,
      productName: product?.name || 'Unknown Product'
    };
  } catch (error) {
    console.error("Error fetching product purchases:", error);
    return {
      data: [],
      productName: ''
    };
  }
}
export async function getProductMoves(productId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    data: [],
    productName: ''
  };
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        name: true,
        uom: true
      }
    });
    const moves = await prisma.stockMove.findMany({
      where: {
        productId: productId,
        companyId: session.companyId
      },
      include: {
        picking: true,
        sourceLocation: true,
        destLocation: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    const data = moves.map((move: any) => {
      const isAdjustment = move.name?.includes('تحديث') || !move.sourceLocationId || !move.destLocationId;
      return {
        id: move.id,
        date: move.date,
        reference: move.reference || move.picking?.name || (isAdjustment ? 'تحديث مخزون' : 'N/A'),
        productName: product?.name || move.name || 'Unknown Product',
        source: move.sourceLocation?.name || (isAdjustment ? 'Inventory adjustment' : 'Unknown'),
        dest: move.destLocation?.name || (isAdjustment ? 'Inventory adjustment' : 'Unknown'),
        quantity: Number(move.quantityDone > 0 ? move.quantityDone : move.quantity),
        unitName: move.unitName || product?.uom || '-',
        secQty: Number(move.secQtyDone > 0 ? move.secQtyDone : move.secQty),
        secUnitName: move.secUnitName || '-',
        status: move.status
      };
    });
    return {
      data,
      productName: product?.name || 'Unknown Product'
    };
  } catch (error) {
    console.error("Error fetching product moves:", error);
    return {
      data: [],
      productName: ''
    };
  }
}