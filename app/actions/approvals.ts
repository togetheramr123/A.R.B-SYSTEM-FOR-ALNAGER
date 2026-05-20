"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
export async function getApprovalRequests() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  try {
    const requests = await prisma.approvalRequest.findMany({
    where: {
      companyId: session.companyId
    },
    include: {
      requester: {
        select: {
          name: true,
          email: true
        }
      },
      approver: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return requests.map(req => ({
    ...req,
    parsedDetails: req.details ? JSON.parse(req.details) : {}
  }));
  } catch (e) {
    console.error("Failed to fetch approvals:", e);
    return [];
  }
}
export async function handleApprovalAction(requestId: string, action: 'approve' | 'reject') {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session || session.role !== 'OWNER' && session.role !== 'MANAGER') {
    return {
      error: 'Unauthorized. Only Managers can approve or reject requests.'
    };
  }
  try {
    const updated = await prisma.approvalRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        approverId: session.userId
      }
    });
    if (updated.resourceModel === 'SaleOrder' && updated.resourceId) {
      await prisma.saleOrder.update({
        where: {
          id: updated.resourceId
        },
        data: {
          approvalStatus: action === 'approve' ? 'approved' : 'rejected'
        }
      });
      await prisma.message.create({
        data: {
          saleOrderId: updated.resourceId,
          body: action === 'approve' ? `تم الاعتماد الاستثنائي من قبل الإدارة (${session.role}).` : `تم رفض الاعتماد من قبل الإدارة (${session.role}).`,
          subtype: "mt_comment"
        }
      });
    } else if (updated.resourceModel === 'Invoice' && updated.resourceId) {
      await prisma.invoice.update({
        where: {
          id: updated.resourceId
        },
        data: {
          approvalStatus: action === 'approve' ? 'approved' : 'rejected'
        }
      });
      await prisma.message.create({
        data: {
          invoiceId: updated.resourceId,
          body: action === 'approve' ? `تم الاعتماد الاستثنائي من قبل الإدارة (${session.role}).` : `تم رفض الاعتماد من قبل الإدارة (${session.role}).`,
          subtype: "mt_comment"
        }
      });
    }
    revalidatePath('/[locale]/inventory/approvals');
    revalidatePath('/[locale]/inventory/operations');
    revalidatePath('/[locale]/sales');
    return {
      success: true,
      request: updated
    };
  } catch (e) {
    console.error("Failed to process approval action:", e);
    return {
      error: 'Failed to process approval action'
    };
  }
}