"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getCompanyId } from '@/lib/getCompanyId';
import { revalidatePath } from 'next/cache';
export async function assignCollectionPolicy(invoiceId: string, data: {
  collectionPolicy: string;
  collectionAssigneeId?: string;
  collectionNotes?: string;
  collectionDueDate?: string;
}) {
  const session = await getSession();
  if (!session?.userId) throw new Error('غير مصرح');
  await ensureAccess("account_move", "write");

  await prisma.invoice.update({
    where: {
      id: invoiceId
    },
    data: {
      collectionPolicy: data.collectionPolicy,
      collectionAssigneeId: data.collectionAssigneeId || null,
      collectionNotes: data.collectionNotes || null,
      collectionDueDate: data.collectionDueDate ? new Date(data.collectionDueDate) : null,
      collectionStatus: 'pending'
    }
  });
  if (data.collectionAssigneeId && data.collectionAssigneeId !== session.userId) {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId
      },
      include: {
        partner: true
      }
    });
    if (invoice) {
      await sendCollectionMessage({
        invoiceId,
        receiverId: data.collectionAssigneeId,
        message: `تم تعيينك لمتابعة تحصيل فاتورة ${invoice.name} — ${invoice.partner?.name || '—'} — ${Number(invoice.amountResidual).toLocaleString('ar-EG')} ج.م`,
        actionType: 'follow_up'
      });
    }
  }
  try {
    revalidatePath('/accounting/invoices');
  } catch (error) { console.error("Silent error caught in app/actions/collection.ts:", error); }
}
export async function sendCollectionMessage(data: {
  invoiceId: string;
  receiverId: string;
  message: string;
  actionType?: string;
}) {
  const session = await getSession();
  if (!session?.userId) throw new Error('غير مصرح');
  await ensureAccess("account_move", "write");

  const companyId = await getCompanyId();
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: data.invoiceId
    },
    include: {
      partner: true
    }
  });
  return await prisma.collectionMessage.create({
    data: {
      invoiceId: data.invoiceId,
      senderId: session.userId,
      receiverId: data.receiverId,
      message: data.message,
      invoiceRef: invoice?.name,
      partnerName: invoice?.partner?.name,
      amount: invoice?.amountResidual,
      actionType: data.actionType || 'follow_up',
      companyId
    }
  });
}
export async function getMyMessages(unreadOnly: boolean = false) {
  const session = await getSession();
  if (!session?.userId) return [];
  await ensureAccess("base", "read");

  const where: any = {
    receiverId: session.userId
  };
  if (unreadOnly) where.isRead = false;
  const messages = await prisma.collectionMessage.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });
  const senderIds = [...new Set(messages.map(m => m.senderId))];
  const senders = await prisma.user.findMany({
    where: {
      id: {
        in: senderIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  const senderMap = Object.fromEntries(senders.map(s => [s.id, s.name]));
  return messages.map((m: any) => ({
    ...m,
    amount: m.amount ? Number(m.amount) : null,
    senderName: senderMap[m.senderId] || 'مجهول'
  }));
}
export async function getUnreadMessageCount() {
  const session = await getSession();
  if (!session?.userId) return 0;
  await ensureAccess("base", "read");

  return await prisma.collectionMessage.count({
    where: {
      receiverId: session.userId,
      isRead: false
    }
  });
}
export async function markMessageRead(messageId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "write");

  await prisma.collectionMessage.update({
    where: {
      id: messageId
    },
    data: {
      isRead: true
    }
  });
}
export async function markAllMessagesRead() {
  const session = await getSession();
  if (!session?.userId) return;
  await ensureAccess("account_move", "write");

  await prisma.collectionMessage.updateMany({
    where: {
      receiverId: session.userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });
}
export async function getMyPendingWork() {
  const session = await getSession();
  if (!session?.userId) return {
    collectionTasks: [],
    draftInvoices: [],
    draftQuotes: [],
    messages: [],
    overdueInvoices: []
  };
  await ensureAccess("base", "read");

  const companyId = session.companyId;
  const now = new Date();
  const [collectionTasks, draftInvoices, draftQuotes, messages, overdueInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        collectionAssigneeId: session.userId,
        collectionStatus: {
          in: ['pending', 'in_progress', 'overdue']
        },
        state: 'posted',
        companyId
      },
      include: { partner: true }
    }),
    prisma.invoice.findMany({
      where: {
        state: 'draft',
        createdById: session.userId,
        companyId
      },
      include: { partner: true }
    }),
    prisma.saleOrder.findMany({
      where: {
        status: 'draft',
        userId: session.userId,
        companyId
      },
      include: { partner: true }
    }),
    prisma.collectionMessage.findMany({
      where: {
        receiverId: session.userId,
        isRead: false
      }
    }),
    prisma.invoice.findMany({
      where: {
        state: 'posted',
        companyId,
        dateDue: {
          lt: now
        },
        amountResidual: {
          gt: 0
        },
        OR: [{
          collectionAssigneeId: session.userId
        }, {
          createdById: session.userId
        }]
      },
      include: { partner: true }
    })
  ]);
  const senderIds = [...new Set(messages.map(m => m.senderId))];
  const senders = await prisma.user.findMany({
    where: {
      id: {
        in: senderIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  const senderMap = Object.fromEntries(senders.map(s => [s.id, s.name]));
  return {
    collectionTasks: collectionTasks.map((inv: any) => ({
      id: inv.id,
      name: inv.name,
      partnerName: inv.partner?.name,
      amountResidual: Number(inv.amountResidual),
      amountTotal: Number(inv.amountTotal),
      collectionDueDate: inv.collectionDueDate,
      collectionStatus: inv.collectionStatus,
      collectionNotes: inv.collectionNotes,
      daysOverdue: inv.collectionDueDate && inv.collectionDueDate < now ? Math.ceil((now.getTime() - new Date(inv.collectionDueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
    })),
    draftInvoices: draftInvoices.map((inv: any) => ({
      id: inv.id,
      name: inv.name,
      partnerName: inv.partner?.name,
      amountTotal: Number(inv.amountTotal),
      createdAt: inv.createdAt
    })),
    draftQuotes: draftQuotes.map((q: any) => ({
      id: q.id,
      name: q.name,
      partnerName: q.partner?.name,
      amountTotal: Number(q.amountTotal),
      dateOrder: q.dateOrder
    })),
    messages: messages.map((m: any) => ({
      ...m,
      amount: m.amount ? Number(m.amount) : null,
      senderName: senderMap[m.senderId] || 'مجهول'
    })),
    overdueInvoices: overdueInvoices.map((inv: any) => ({
      id: inv.id,
      name: inv.name,
      partnerName: inv.partner?.name,
      amountResidual: Number(inv.amountResidual),
      dateDue: inv.dateDue,
      daysOverdue: Math.ceil((now.getTime() - new Date(inv.dateDue!).getTime()) / (1000 * 60 * 60 * 24))
    }))
  };
}
export async function markAsCollected(invoiceId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "write");

  await prisma.invoice.update({
    where: {
      id: invoiceId
    },
    data: {
      collectionStatus: 'collected'
    }
  });
  try {
    revalidatePath('/dashboard');
  } catch (error) { console.error("Silent error caught in app/actions/collection.ts:", error); }
}
export async function getCashRegisterUsers() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const users = await prisma.user.findMany({
    where: {
      cashRegisterEnabled: true,
      canReceive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      cashRegister: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
  return users;
}