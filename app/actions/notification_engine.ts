"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export async function dispatchNotification(params: {
  eventCode: string;
  subject: string;
  body: string;
  type?: string;
  [key: string]: any;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    const rule = await prisma.notificationRule.findUnique({
      where: {
        eventCode: params.eventCode
      }
    });
    if (!rule) {
      console.warn(`Notification rule not found for eventCode: ${params.eventCode}`);
      await sendToAdmins(params);
      return;
    }
    if (!rule.isActive && !rule.isCritical) {
      return;
    }
    let userIds = new Set<string>();
    if (rule.targetType === 'all_admins' || rule.isCritical) {
      const adminGroups = await prisma.resGroup.findMany({
        where: {
          name: {
            contains: 'Admin'
          }
        },
        include: {
          users: true
        }
      });
      adminGroups.forEach(g => g.users.forEach(u => userIds.add(u.id)));
    }
    if (rule.targetType === 'specific_roles' && rule.targetRoles) {
      const roleIds = rule.targetRoles.split(',').filter(Boolean);
      if (roleIds.length > 0) {
        const groups = await prisma.resGroup.findMany({
          where: {
            id: {
              in: roleIds
            }
          },
          include: {
            users: true
          }
        });
        groups.forEach(g => g.users.forEach((u: any) => userIds.add(u.id)));
      }
    }
    if (rule.targetType === 'specific_users' && rule.targetUsers) {
      const uIds = rule.targetUsers.split(',').filter(Boolean);
      uIds.forEach(id => userIds.add(id));
    }
    if (userIds.size > 0) {
      const resourceId = params.invoiceId || params.saleOrderId || params.purchaseOrderId || params.ticketId || null;
      let resourceModel = null;
      if (params.invoiceId) resourceModel = 'Invoice';
      else if (params.saleOrderId) resourceModel = 'SaleOrder';
      else if (params.purchaseOrderId) resourceModel = 'PurchaseOrder';
      else if (params.ticketId) resourceModel = 'Ticket';

      const notificationsData = Array.from(userIds).map(userId => ({
        userId,
        title: params.subject,
        message: params.body,
        type: params.type || 'info',
        resourceId,
        resourceModel
      }));
      await prisma.notification.createMany({
        data: notificationsData
      });
    }
  } catch (e) {
    console.error('Error dispatching notification:', e);
  }
}
async function sendToAdmins(params: any) {
  var session = await getSession();
}
;
// ==========================================
// Settings API
// ==========================================
export async function getNotificationRules() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    const rules = await prisma.notificationRule.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    return rules;
  } catch (error) {
    console.error("Failed to load rules:", error);
    return [];
  }
}
export async function updateNotificationRule(id: string, data: Partial<any>) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  try {
    var session = await getSession();
    if (!session) throw new Error('Unauthorized');
    await prisma.notificationRule.update({
      where: {
        id
      },
      data
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("Failed to update rule:", error);
    return {
      success: false,
      error: 'حدث خطأ'
    };
  }
}