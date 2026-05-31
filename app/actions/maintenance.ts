'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAuditAction } from './audit';

/**
 * تفعيل وضع الصيانة — يظهر إشعار لكل المستخدمين
 * @param minutesFromNow - عدد الدقائق حتى بدء الصيانة (الافتراضي: 1)
 * @param message - رسالة مخصصة (اختياري)
 */
export async function enableMaintenanceMode(minutesFromNow: number = 1, message?: string) {
  const session = await getSession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
    return { error: 'غير مصرح لك بتفعيل وضع الصيانة' };
  }

  const company = await prisma.company.findFirst();
  if (!company) return { error: 'لا توجد شركة' };

  const maintenanceAt = new Date(Date.now() + minutesFromNow * 60 * 1000);

  await prisma.company.update({
    where: { id: company.id },
    data: {
      maintenanceMode: true,
      maintenanceMessage: message || 'جاري تحديث النظام — يرجى حفظ عملك الآن',
      maintenanceAt: maintenanceAt,
    },
  });

  await logAuditAction({
    action: 'MAINTENANCE_ENABLED',
    model: 'Company',
    recordId: company.id,
    newValues: { details: `تفعيل وضع الصيانة — التحديث بعد ${minutesFromNow} دقيقة` },
  });

  revalidatePath('/');
  return { success: true, maintenanceAt };
}

/**
 * إلغاء وضع الصيانة — إخفاء الإشعار
 */
export async function disableMaintenanceMode() {
  const session = await getSession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
    return { error: 'غير مصرح لك' };
  }

  const company = await prisma.company.findFirst();
  if (!company) return { error: 'لا توجد شركة' };

  await prisma.company.update({
    where: { id: company.id },
    data: {
      maintenanceMode: false,
      maintenanceMessage: null,
      maintenanceAt: null,
    },
  });

  await logAuditAction({
    action: 'MAINTENANCE_DISABLED',
    model: 'Company',
    recordId: company.id,
    newValues: { details: 'إلغاء وضع الصيانة' },
  });

  revalidatePath('/');
  return { success: true };
}

/**
 * الحصول على حالة الصيانة الحالية
 */
export async function getMaintenanceStatus() {
  const company = await prisma.company.findFirst({
    select: {
      maintenanceMode: true,
      maintenanceMessage: true,
      maintenanceAt: true,
    },
  });

  return {
    enabled: company?.maintenanceMode || false,
    message: company?.maintenanceMessage || null,
    scheduledAt: company?.maintenanceAt || null,
  };
}
