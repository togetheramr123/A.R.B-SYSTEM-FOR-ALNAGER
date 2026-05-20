"use server";
import { getSession } from "@/lib/auth";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getPortalUser } from '@/lib/portalAuth';
import { Decimal } from '@prisma/client/runtime/library';
export async function submitPortalOrder(data: {
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    uom: string;
  }[];
  notes?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return {
    success: false,
    error: 'غير مصرح'
  };
  if (!data.items || data.items.length === 0) {
    return {
      success: false,
      error: 'السلة فارغة'
    };
  }
  try {
    const count = await prisma.saleOrder.count({
      where: {
        companyId: portalUser.companyId
      }
    });
    const orderName = `S${String(count + 1).padStart(5, '0')}`;
    let amountUntaxed = 0;
    const lines = data.items.map((item, index) => {
      const lineTotal = item.quantity * item.price;
      amountUntaxed += lineTotal;
      return {
        sequence: (index + 1) * 10,
        productId: item.productId,
        name: item.name,
        quantity: new Decimal(item.quantity),
        priceUnit: new Decimal(item.price),
        priceSubtotal: new Decimal(lineTotal),
        discount: new Decimal(0),
        unitName: item.uom || 'Units'
      };
    });

    const saleOrder = await prisma.saleOrder.create({
      data: {
        name: orderName,
        partnerId: portalUser.partnerId,
        companyId: portalUser.companyId,
        dateOrder: new Date(),
        status: 'draft',
        source: 'portal',
        amountUntaxed: new Decimal(amountUntaxed),
        amountTotal: new Decimal(amountUntaxed),
        note: data.notes || '',
        lines: {
          create: lines
        }
      }
    });

    const erpUsers = await prisma.user.findMany({
      where: {
        companyId: portalUser.companyId
      },
      select: {
        id: true
      },
      take: 10
    });
    if (erpUsers.length > 0) {
      await prisma.notification.createMany({
        data: erpUsers.map(u => ({
          title: `📱 طلب جديد من التطبيق`,
          message: `${portalUser.name} أرسل طلب عرض سعر (${orderName}) بقيمة ${amountUntaxed.toFixed(2)} ج.م`,
          type: 'portal_order',
          userId: u.id,
          resourceId: saleOrder.id,
          resourceModel: 'SaleOrder',
          linkUrl: `/ar/sales/${saleOrder.id}`,
          companyId: portalUser.companyId
        }))
      });
    }

    return {
      success: true,
      orderId: saleOrder.id,
      orderName: saleOrder.name
    };
  } catch (error) {
    console.error('Portal order error:', error);
    return {
      success: false,
      error: 'حدث خطأ أثناء إرسال الطلب'
    };
  }
}
export async function getPortalOrders() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return [];
  const orders = await prisma.saleOrder.findMany({
    where: {
      partnerId: portalUser.partnerId,
      companyId: portalUser.companyId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      lines: {
        select: {
          id: true,
          productId: true,
          name: true,
          quantity: true,
          priceUnit: true,
          priceSubtotal: true,
          unitName: true
        }
      }
    },
    take: 50
  });
  return orders.map(order => ({
    id: order.id,
    name: order.name,
    status: order.status,
    source: order.source || 'portal',
    dateOrder: order.dateOrder.toISOString(),
    amountTotal: Number(new Decimal(order.amountTotal || 0).toString()),
    note: order.note,
    lines: order.lines.map(l => ({
      id: l.id,
      productId: l.productId,
      name: l.name || 'منتج غير معروف',
      quantity: Number(new Decimal(l.quantity || 0).toString()),
      priceUnit: Number(new Decimal(l.priceUnit || 0).toString()),
      priceSubtotal: Number(new Decimal(l.priceSubtotal || 0).toString()),
      unitName: l.unitName
    }))
  }));
}