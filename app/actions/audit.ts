"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getCompanyId } from '@/lib/getCompanyId'; /** * تسجيل إجراء في سجل المراجعة */
export async function logAuditAction(params: {
  action: string;
  model: string;
  recordId: string;
  recordName?: string | null;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    var session = await getSession();
    if (!session) return;
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      },
      select: {
        name: true
      }
    });
    const companyId = await getCompanyId();
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        userName: user?.name || 'Unknown',
        action: params.action,
        model: params.model,
        recordId: params.recordId,
        recordName: params.recordName,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        companyId
      }
    });
  } catch (error) {
    // Don't let audit logging break the main operation
    console.error('Audit log failed:', error);
  }
} /** * جلب سجل المراجعة مع تصفية */
export async function getAuditLogs(filters?: {
  model?: string;
  recordId?: string;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  const where: any = {};
  if (filters?.model) where.model = filters.model;
  if (filters?.recordId) where.recordId = filters.recordId;
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters?.from) where.createdAt.gte = new Date(filters.from);
    if (filters?.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }
  const companyId = await getCompanyId();
  if (companyId) where.companyId = companyId;
  return await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    take: filters?.limit || 100
  });
} /** * جلب سجل المراجعة لسجل محدد */
export async function getRecordAuditHistory(model: string, recordId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.auditLog.findMany({
    where: {
      model,
      recordId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });
}