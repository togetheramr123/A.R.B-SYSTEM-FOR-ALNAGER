"use server";
import { ensureAccess } from '@/lib/access';

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export async function getCurrentUserInfo() {
  const session = await getSession();
  if (!session) return { userId: '', isAdmin: false };
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return { userId: session.userId, isAdmin: user?.role === 'ADMIN' };
}

export async function createFollowUp(data: {
  partnerId: string;
  assignedUserId: string;
  followUpDate: Date;
  notes: string;
  saleOrderId?: string;
  invoiceId?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const followUp = await prisma.$transaction(async tx => {
    const existing = await tx.debtFollowUp.findFirst({
      where: {
        partnerId: data.partnerId,
        status: "pending"
      }
    });
    let result;
    if (existing) {
      result = await tx.debtFollowUp.update({
        where: {
          id: existing.id
        },
        data: {
          assignedUserId: data.assignedUserId,
          nextFollowUpDate: data.followUpDate,
          notes: data.notes,
          saleOrderId: data.saleOrderId || existing.saleOrderId
        }
      });
      await tx.debtFollowUpHistory.create({
        data: {
          followUpId: existing.id,
          userId: session.userId,
          action: "updated",
          notes: `تم التعديل. ملاحظات: ${data.notes}`,
          previousDate: existing.nextFollowUpDate,
          newDate: data.followUpDate
        }
      });
    } else {
      result = await tx.debtFollowUp.create({
        data: {
          partnerId: data.partnerId,
          assignedUserId: data.assignedUserId,
          nextFollowUpDate: data.followUpDate,
          notes: data.notes,
          saleOrderId: data.saleOrderId,
          companyId: session.companyId
        }
      });
      await tx.debtFollowUpHistory.create({
        data: {
          followUpId: result.id,
          userId: session.userId,
          action: "created",
          notes: `بدء المتابعة. ملاحظات: ${data.notes}`,
          newDate: data.followUpDate
        }
      });
    }
    return result;
  });
  revalidatePath("/");
  return {
    success: true,
    followUp
  };
}
export async function getPendingFollowUpsForUser() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return await prisma.debtFollowUp.findMany({
    where: {
      assignedUserId: session.userId,
      status: "pending",
      nextFollowUpDate: {
        lte: new Date()
      }
    },
    include: {
      partner: true
    },
    orderBy: {
      nextFollowUpDate: "asc"
    }
  });
}
export async function processFollowUpAction(id: string, action: "snooze" | "complete", notes: string, nextDate?: Date) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await prisma.$transaction(async tx => {
    const followUp = await tx.debtFollowUp.findUnique({
      where: {
        id
      }
    });
    if (!followUp) throw new Error("المتابعة غير موجودة");
    if (action === "complete") {
      await tx.debtFollowUp.update({
        where: {
          id
        },
        data: {
          status: "completed"
        }
      });
      await tx.debtFollowUpHistory.create({
        data: {
          followUpId: id,
          userId: session.userId,
          action: "completed",
          notes: `تم إنهاء المتابعة. الملاحظات: ${notes}`
        }
      });
    } else if (action === "snooze" && nextDate) {
      await tx.debtFollowUp.update({
        where: {
          id
        },
        data: {
          nextFollowUpDate: nextDate,
          notes: notes
        }
      });
      await tx.debtFollowUpHistory.create({
        data: {
          followUpId: id,
          userId: session.userId,
          action: "snoozed",
          notes: `تأجيل وتحديث. الملاحظات: ${notes}`,
          previousDate: followUp.nextFollowUpDate,
          newDate: nextDate
        }
      });
    }
  });
  revalidatePath("/");
  return {
    success: true
  };
}
export async function escalateToUser(followUpId: string, assignedUserId: string, message: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح"); // فحص صلاحية المدير فقط
  const currentUser = await prisma.user.findUnique({
    where: {
      id: session.userId
    },
    select: {
      role: true
    }
  });
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("هذا الإجراء متاح للمديرين فقط");
  } // Fetch followUp details
  const followUp = await prisma.debtFollowUp.findUnique({
    where: {
      id: followUpId
    },
    include: {
      partner: true
    }
  });
  if (!followUp) throw new Error("المتابعة غير موجودة"); // Record escalation in history
  await prisma.debtFollowUpHistory.create({
    data: {
      followUpId,
      userId: session.userId,
      action: "escalated",
      notes: `توجيه إداري: ${message}`
    }
  }); // Create a real Notification for the user
  await prisma.notification.create({
    data: {
      userId: assignedUserId,
      title: `توجيه إداري: متابعة العميل ${followUp.partner.name}`,
      message: `لماذا لم تتواصل مع العميل؟\n\nتوجيه المدير: ${message}`,
      type: "URGENT",
      linkUrl: `/contacts/${followUp.partnerId}`,
      companyId: session.companyId
    }
  });
  revalidatePath("/");
  return {
    success: true
  };
}
export async function getAllFollowUpsReport() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return await prisma.debtFollowUp.findMany({
    where: {
      companyId: session.companyId
    },
    include: {
      partner: true,
      assignedUser: {
        select: {
          id: true,
          name: true
        }
      },
      history: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      nextFollowUpDate: "asc"
    }
  });
}