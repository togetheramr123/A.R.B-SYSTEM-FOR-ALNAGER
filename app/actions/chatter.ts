"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
export type ChatterModel = 'product' | 'saleOrder' | 'purchaseOrder' | 'invoice' | 'stockPicking' | 'partner' | 'payment';
const getModelField = (model: ChatterModel) => {
  switch (model) {
    case 'product':
      return 'productId';
    case 'saleOrder':
      return 'saleOrderId';
    case 'purchaseOrder':
      return 'purchaseOrderId';
    case 'invoice':
      return 'invoiceId';
    case 'stockPicking':
      return 'stockPickingId';
    case 'partner':
      return 'partnerId';
    case 'payment':
      return 'paymentId';
    default:
      throw new Error("Unsupported chatter model");
  }
};
export async function getChatterMessages(model: ChatterModel, id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  const field = getModelField(model);
  try {
    const messages = await prisma.message.findMany({
      where: {
        [field]: id
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        trackingValues: true,
        attachments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return messages;
  } catch (e) {
    console.error("Fetch Chatter Error:", e);
    return [];
  }
}
export async function addChatterMessage(model: ChatterModel, id: string, body: string, isLog: boolean = false, attachmentIds?: string[]) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const field = getModelField(model);
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      }
    });
    const message = await prisma.message.create({
      data: {
        body,
        type: isLog ? 'notification' : 'comment',
        subject: user?.name || user?.email || 'System',
        [field]: id
      }
    });

    if (attachmentIds && attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { messageId: message.id }
      });
    }

    revalidatePath(`/[locale]`);
    return {
      success: true,
      message
    };
  } catch (e) {
    console.error("Add Chatter Message Error:", e);
    return {
      error: 'Failed to post message'
    };
  }
}
export async function logSystemAction(model: ChatterModel, id: string, actionMsg: string, companyId?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    const field = getModelField(model);
    await prisma.message.create({
      data: {
        body: actionMsg,
        type: 'notification',
        subject: 'System',
        [field]: id
      }
    });
  } catch (e) {
    console.error("Failed to log system action:", e);
  }
}
export interface TrackingChange {
  fieldName: string;
  fieldDesc: string;
  oldValue: string;
  newValue: string;
}
export async function logTrackingChanges(model: ChatterModel, id: string, changes: TrackingChange[], body?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (!changes || changes.length === 0) return;
  var session = await getSession();
  const field = getModelField(model);
  try {
    let subject = 'System';
    if (session?.userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: session.userId
        }
      });
      subject = user?.name || user?.email || 'System';
    }
    await prisma.message.create({
      data: {
        body: body || 'قام بتحديث البيانات',
        type: 'notification',
        subject,
        [field]: id,
        trackingValues: {
          create: changes.map(ch => ({
            fieldName: ch.fieldName,
            fieldDesc: ch.fieldDesc,
            oldValue: ch.oldValue,
            newValue: ch.newValue
          }))
        }
      }
    });
  } catch (e) {
    console.error("Failed to log tracking changes:", e);
  }
}