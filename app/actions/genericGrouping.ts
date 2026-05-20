"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export async function fetchGroupHeaders(model: string, groupBy: string, filters: any = {}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const where = {
    ...filters,
    companyId: session.companyId
  };
  try {
    const delegate = (prisma as any)[model];
    if (!delegate) throw new Error(`Model ${model} not found in Prisma`);
    const groups = await delegate.groupBy({
      by: [groupBy],
      where,
      _count: {
        _all: true
      }
    });
    let relationMap: Record<string, string> = {};
    if (groupBy.endsWith('Id') && groupBy !== 'id') {
      const relationModel = groupBy.replace('Id', '');
      const relationDelegate = (prisma as any)[relationModel];
      if (relationDelegate) {
        const ids = groups.map((g: any) => g[groupBy]).filter(Boolean);
        if (ids.length > 0) {
          const relations = await relationDelegate.findMany({
            where: {
              id: {
                in: ids
              }
            },
            select: {
              id: true,
              name: true
            }
          });
          relations.forEach((r: any) => {
            relationMap[r.id] = r.name;
          });
        }
      }
    }
    return groups.map((g: any) => {
      const rawValue = g[groupBy];
      let label = String(rawValue || 'غير محدد');
      if (relationMap[rawValue]) {
        label = relationMap[rawValue];
      }
      if (groupBy === 'status') {
        const statusMap: Record<string, string> = {
          'draft': 'مسودة / عرض سعر',
          'sent': 'تم الإرسال',
          'purchase': 'طلب شراء مؤكد',
          'sale': 'أمر بيع',
          'done': 'مقفل / منتهي',
          'cancel': 'ملغي'
        };
        if (statusMap[rawValue]) label = statusMap[rawValue];
      }
      return {
        value: rawValue,
        label: label,
        count: g._count._all
      };
    });
  } catch (e: any) {
    console.error("Error in fetchGroupHeaders:", e);
    return [];
  }
}
export async function fetchGroupRows(model: string, groupBy: string, groupValue: any, filters: any = {}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const where = {
    ...filters,
    companyId: session.companyId,
    [groupBy]: groupValue === 'null' ? null : groupValue
  };
  try {
    const delegate = (prisma as any)[model];
    if (!delegate) throw new Error(`Model ${model} not found in Prisma`);
    let include: any = undefined;
    if (model === 'purchaseOrder' || model === 'saleOrder' || model === 'invoice') {
      include = {
        partner: true
      };
    }
    if (model === 'stockPicking' || model === 'stockMove') {
      include = {
        product: true
      };
    }
    const rows = await delegate.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' }
    });
    return JSON.parse(JSON.stringify(rows));
  } catch (e: any) {
    console.error("Error in fetchGroupRows:", e);
    return [];
  }
}