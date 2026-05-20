"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { ensureAccess } from "@/lib/access";
import { getCompanyId } from "@/lib/getCompanyId";
import { Decimal } from "@prisma/client/runtime/library";
import { logAuditAction } from "@/app/actions/audit"; // ==========================================
// إدارة الشيكات — CRUD
// ========================================== /** جلب كل الشيكات */
export async function getCheques(filters?: {
  type?: "inbound" | "outbound";
  status?: string;
  from?: string;
  to?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "read");
  const where: any = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.from || filters?.to) {
    where.dueDate = {};
    if (filters?.from) where.dueDate.gte = new Date(filters.from);
    if (filters?.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      where.dueDate.lte = to;
    }
  }
  const cheques = await prisma.cheque.findMany({
    where,
    include: {
      partner: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      dueDate: "asc"
    }
  });
  return cheques.map((c: any) => ({
    ...c,
    amount: Number(c.amount)
  }));
} /** جلب شيك واحد */
export async function getCheque(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "read");
  if (id === "new") return null;
  const cheque = await prisma.cheque.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      journal: true
    }
  });
  if (!cheque) return null;
  return {
    ...cheque,
    amount: Number(cheque.amount)
  };
} /** إنشاء شيك جديد */
export async function createCheque(data: {
  number: string;
  type: "inbound" | "outbound";
  amount: number;
  issueDate: string;
  dueDate: string;
  bankName?: string;
  partnerId?: string;
  journalId?: string;
  notes?: string;
  ref?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "create");
  const companyId = await getCompanyId();
  const cheque = await prisma.cheque.create({
    data: {
      number: data.number,
      type: data.type,
      amount: new Decimal(data.amount),
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      bankName: data.bankName,
      partnerId: data.partnerId,
      journalId: data.journalId,
      notes: data.notes,
      ref: data.ref,
      status: "draft",
      companyId,
      createdById: session.userId
    }
  });
  await logAuditAction({
    action: "create",
    model: "Cheque",
    recordId: cheque.id,
    recordName: `شيك ${cheque.number}`,
    newValues: {
      number: data.number,
      amount: data.amount,
      type: data.type,
      dueDate: data.dueDate
    }
  });
  try {
    revalidatePath("/[locale]/accounting/cheques");
  } catch (error) { console.error("Silent error caught in app/actions/cheques.ts:", error); }
  return cheque;
} /** تحديث شيك (في حالة المسودة فقط) */
export async function updateCheque(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "write");
  const existing = await prisma.cheque.findUnique({
    where: {
      id
    }
  });
  if (!existing) throw new Error("الشيك غير موجود");
  if (existing.status !== "draft") throw new Error("لا يمكن تعديل شيك غير المسودة");
  const cheque = await prisma.cheque.update({
    where: {
      id
    },
    data: {
      number: data.number,
      type: data.type,
      amount: data.amount ? new Decimal(data.amount) : undefined,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      bankName: data.bankName,
      partnerId: data.partnerId,
      journalId: data.journalId,
      notes: data.notes,
      ref: data.ref
    }
  });
  try {
    revalidatePath("/[locale]/accounting/cheques");
  } catch (error) { console.error("Silent error caught in app/actions/cheques.ts:", error); }
  return cheque;
} // ==========================================
// دورة حياة الشيك
// ========================================== /** تسجيل شيك (draft → registered) */
export async function registerCheque(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "write");
  const cheque = await prisma.cheque.findUnique({
    where: {
      id
    },
    include: {
      partner: true
    }
  });
  if (!cheque) throw new Error("الشيك غير موجود");
  if (cheque.status !== "draft") throw new Error("الشيك ليس في حالة مسودة");
  const companyId = await getCompanyId();
  await prisma.$transaction(async tx => {
    // Create JE: Dr/Cr Cheques Under Collection / Receivable or Payable
    const isInbound = cheque.type === "inbound"; // Find accounts
    const chequesAccount = (await tx.account.findFirst({
      where: {
        name: {
          contains: "شيكات"
        }
      }
    })) || (await tx.account.create({
      data: {
        code: "103050",
        name: "شيكات تحت التحصيل",
        type: "current_assets",
        companyId: companyId || ""
      }
    }));
    const partnerAccount = isInbound ? await tx.account.findFirst({
      where: {
        type: "receivable"
      }
    }) : await tx.account.findFirst({
      where: {
        type: "payable"
      }
    });
    if (partnerAccount) {
      const journal = cheque.journalId ? await tx.journal.findUnique({
        where: {
          id: cheque.journalId
        }
      }) : await tx.journal.findFirst({
        where: {
          type: {
            in: ["bank", "cash"]
          }
        }
      });
      if (journal) {
        const entry = await tx.journalEntry.create({
          data: {
            name: `CHQ/REG/${cheque.number}`,
            date: new Date(),
            journalId: journal.id,
            partnerId: cheque.partnerId,
            ref: `تسجيل شيك ${cheque.number}`,
            state: "posted",
            companyId,
            createdById: session.userId,
            items: {
              create: isInbound ? [{
                accountId: chequesAccount.id,
                name: `شيك وارد ${cheque.number}`,
                debit: cheque.amount,
                credit: 0,
                companyId
              }, {
                accountId: partnerAccount.id,
                name: `شيك وارد ${cheque.number}`,
                debit: 0,
                credit: cheque.amount,
                companyId
              }] : [{
                accountId: partnerAccount.id,
                name: `شيك صادر ${cheque.number}`,
                debit: cheque.amount,
                credit: 0,
                companyId
              }, {
                accountId: chequesAccount.id,
                name: `شيك صادر ${cheque.number}`,
                debit: 0,
                credit: cheque.amount,
                companyId
              }]
            }
          }
        });
        await tx.cheque.update({
          where: {
            id
          },
          data: {
            status: "registered",
            registerEntryId: entry.id
          }
        });
      }
    }
  });
  await logAuditAction({
    action: "post",
    model: "Cheque",
    recordId: id,
    recordName: `شيك ${cheque.number}`,
    newValues: {
      status: "registered"
    }
  }); // === إشعارات ===
  await _notifyChequeAction(cheque, "تم تسجيل", session.userId);
  try {
    revalidatePath("/[locale]/accounting/cheques");
  } catch (error) { console.error("Silent error caught in app/actions/cheques.ts:", error); }
  return {
    success: true
  };
} /** تحصيل شيك (registered → collected) */
export async function collectCheque(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "write");
  const companyId = await getCompanyId();
  const cheque = await prisma.cheque.findUnique({
    where: {
      id
    },
    include: {
      partner: true
    }
  });
  if (!cheque) throw new Error("الشيك غير موجود");
  if (cheque.status !== "registered" && cheque.status !== "deposited") {
    throw new Error("الشيك ليس في حالة تسمح بالتحصيل");
  }
  await prisma.$transaction(async tx => {
    const isInbound = cheque.type === "inbound";
    const chequesAccount = await tx.account.findFirst({
      where: {
        name: {
          contains: "شيكات"
        }
      }
    });
    const bankAccount = (await tx.account.findFirst({
      where: {
        type: "bank"
      }
    })) || (await tx.account.findFirst({
      where: {
        type: "cash"
      }
    }));
    if (chequesAccount && bankAccount) {
      const journal = cheque.journalId ? await tx.journal.findUnique({
        where: {
          id: cheque.journalId
        }
      }) : await tx.journal.findFirst({
        where: {
          type: {
            in: ["bank", "cash"]
          }
        }
      });
      if (journal) {
        const entry = await tx.journalEntry.create({
          data: {
            name: `CHQ/COL/${cheque.number}`,
            date: new Date(),
            journalId: journal.id,
            partnerId: cheque.partnerId,
            ref: `تحصيل شيك ${cheque.number}`,
            state: "posted",
            companyId,
            createdById: session.userId,
            items: {
              create: isInbound ? [{
                accountId: bankAccount.id,
                name: `تحصيل شيك ${cheque.number}`,
                debit: cheque.amount,
                credit: 0,
                companyId
              }, {
                accountId: chequesAccount.id,
                name: `تحصيل شيك ${cheque.number}`,
                debit: 0,
                credit: cheque.amount,
                companyId
              }] : [{
                accountId: chequesAccount.id,
                name: `صرف شيك ${cheque.number}`,
                debit: cheque.amount,
                credit: 0,
                companyId
              }, {
                accountId: bankAccount.id,
                name: `صرف شيك ${cheque.number}`,
                debit: 0,
                credit: cheque.amount,
                companyId
              }]
            }
          }
        });
        await tx.cheque.update({
          where: {
            id
          },
          data: {
            status: "collected",
            collectEntryId: entry.id
          }
        });
      }
    }
  });
  await logAuditAction({
    action: "collect",
    model: "Cheque",
    recordId: id,
    recordName: `شيك ${cheque.number}`,
    newValues: {
      status: "collected"
    }
  });
  await _notifyChequeAction(cheque, "تم تحصيل", session.userId);
  try {
    revalidatePath("/[locale]/accounting/cheques");
  } catch (error) { console.error("Silent error caught in app/actions/cheques.ts:", error); }
  return {
    success: true
  };
} /** رفض شيك (registered → bounced) */
export async function bounceCheque(id: string, reason?: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "write");
  const companyId = await getCompanyId();
  const cheque = await prisma.cheque.findUnique({
    where: {
      id
    },
    include: {
      partner: true
    }
  });
  if (!cheque) throw new Error("الشيك غير موجود");
  if (cheque.status !== "registered" && cheque.status !== "deposited") {
    throw new Error("الشيك ليس في حالة تسمح بالرفض");
  }
  await prisma.$transaction(async tx => {
    // Reverse the registration entry
    if (cheque.registerEntryId) {
      const originalEntry = await tx.journalEntry.findUnique({
        where: {
          id: cheque.registerEntryId
        },
        include: {
          items: true
        }
      });
      if (originalEntry) {
        const journal = await tx.journal.findFirst({
          where: {
            type: {
              in: ["bank", "cash"]
            }
          }
        });
        if (journal) {
          await tx.journalEntry.create({
            data: {
              name: `CHQ/BNC/${cheque.number}`,
              date: new Date(),
              journalId: journal.id,
              partnerId: cheque.partnerId,
              ref: `رفض شيك ${cheque.number}${reason ? ` — ${reason}` : ""}`,
              state: "posted",
              companyId,
              createdById: session.userId,
              items: {
                create: originalEntry.items.map(item => ({
                  accountId: item.accountId,
                  name: `عكس: ${item.name}`,
                  debit: Number(item.credit),
                  credit: Number(item.debit),
                  companyId
                }))
              }
            }
          });
        }
      }
    }
    await tx.cheque.update({
      where: {
        id
      },
      data: {
        status: "bounced",
        notes: reason ? `سبب الرفض: ${reason}\n${cheque.notes || ""}` : cheque.notes
      }
    });
  });
  await logAuditAction({
    action: "bounce",
    model: "Cheque",
    recordId: id,
    recordName: `شيك ${cheque.number}`,
    newValues: {
      status: "bounced",
      reason
    }
  }); // === إشعارات عاجلة عند الرفض ===
  await _notifyChequeAction(cheque, "🔴 تم رفض", session.userId, true); // إشعار للمدير
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN"
    }
  });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: `🔴 شيك مرفوض: ${cheque.number}`,
        message: `تم رفض شيك رقم ${cheque.number} بمبلغ ${Number(cheque.amount).toLocaleString("ar-EG")} من ${cheque.partner?.name || "غير محدد"}${reason ? `\nالسبب: ${reason}` : ""}`,
        type: "URGENT",
        linkUrl: `/accounting/cheques/${id}`,
        companyId
      }
    });
  }
  try {
    revalidatePath("/[locale]/accounting/cheques");
  } catch (error) { console.error("Silent error caught in app/actions/cheques.ts:", error); }
  return {
    success: true
  };
} // ==========================================
// إشعارات الشيكات
// ========================================== /** إشعار عند أي إجراء على الشيك */
async function _notifyChequeAction(cheque: any, action: string, performedByUserId: string, isUrgent: boolean = false) {
  try {
    const companyId = await getCompanyId();
    const performedBy = await prisma.user.findUnique({
      where: {
        id: performedByUserId
      },
      select: {
        name: true
      }
    }); // إشعار للمنشئ (إذا لم يكن هو نفسه)
    if (cheque.createdById && cheque.createdById !== performedByUserId) {
      await prisma.notification.create({
        data: {
          userId: cheque.createdById,
          title: `${action} شيك ${cheque.number}`,
          message: `${performedBy?.name || "النظام"} ${action} الشيك رقم ${cheque.number} بمبلغ ${Number(cheque.amount).toLocaleString("ar-EG")}`,
          type: isUrgent ? "URGENT" : "INFO",
          linkUrl: `/accounting/cheques/${cheque.id}`,
          companyId
        }
      });
    }
  } catch (e) {
    console.error("Cheque notification failed:", e);
  }
} /** فحص الشيكات المستحقة وإرسال إشعارات (يُستدعى من Cron) */
export async function checkDueCheques() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const companyId = await getCompanyId();
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3); // شيكات مستحقة خلال 3 أيام ولم يتم إرسال تنبيه لها
  const dueSoon = await prisma.cheque.findMany({
    where: {
      status: {
        in: ["registered", "deposited"]
      },
      dueDate: {
        gte: now,
        lte: threeDaysFromNow
      },
      reminderSent: false
    },
    include: {
      partner: true
    }
  }); // شيكات متأخرة (مستحقة بالأمس أو قبل);
  const overdue = await prisma.cheque.findMany({
    where: {
      status: {
        in: ["registered", "deposited"]
      },
      dueDate: {
        lt: now
      }
    },
    include: {
      partner: true
    }
  });
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN"
    }
  });
  // إشعارات الشيكات القريبة الاستحقاق
  for (const cheque of dueSoon) {
    const daysLeft = Math.ceil((cheque.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const typeLabel = cheque.type === "inbound" ? "وارد" : "صادر";
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `⏰ شيك ${typeLabel} يستحق خلال ${daysLeft} أيام`,
          message: `شيك رقم ${cheque.number} بمبلغ ${Number(cheque.amount).toLocaleString("ar-EG")} — ${cheque.partner?.name || ""}. تاريخ الاستحقاق: ${cheque.dueDate.toLocaleDateString("ar-EG")}`,
          type: "WARNING",
          linkUrl: `/accounting/cheques/${cheque.id}`,
          companyId
        }
      });
    } // Mark as notified
    await prisma.cheque.update({
      where: {
        id: cheque.id
      },
      data: {
        reminderSent: true
      }
    });
  } 
  
  // إشعارات الشيكات المتأخرة
  for (const cheque of overdue) {
    const daysOverdue = Math.ceil((now.getTime() - cheque.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const typeLabel = cheque.type === "inbound" ? "وارد" : "صادر";
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `🔴 شيك ${typeLabel} متأخر ${daysOverdue} يوم`,
          message: `شيك رقم ${cheque.number} بمبلغ ${Number(cheque.amount).toLocaleString("ar-EG")} — ${cheque.partner?.name || ""} متأخر عن الاستحقاق!`,
          type: "URGENT",
          linkUrl: `/accounting/cheques/${cheque.id}`,
          companyId
        }
      });
    }
  }
  return {
    dueSoonCount: dueSoon.length,
    overdueCount: overdue.length
  };
} /** ملخص الشيكات للداشبورد */
export async function getChequesSummary() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const now = new Date();
  const [total, draftCount, registeredCount, collectedCount, bouncedCount, overdueCount] = await Promise.all([prisma.cheque.count(), prisma.cheque.count({
    where: {
      status: "draft"
    }
  }), prisma.cheque.count({
    where: {
      status: {
        in: ["registered", "deposited"]
      }
    }
  }), prisma.cheque.count({
    where: {
      status: "collected"
    }
  }), prisma.cheque.count({
    where: {
      status: "bounced"
    }
  }), prisma.cheque.count({
    where: {
      status: {
        in: ["registered", "deposited"]
      },
      dueDate: {
        lt: now
      }
    }
  })]);
  const totalInboundAgg = await prisma.cheque.aggregate({
    where: {
      type: "inbound",
      status: {
        in: ["registered", "deposited"]
      }
    },
    _sum: {
      amount: true
    }
  });
  const totalOutboundAgg = await prisma.cheque.aggregate({
    where: {
      type: "outbound",
      status: {
        in: ["registered", "deposited"]
      }
    },
    _sum: {
      amount: true
    }
  });
  return {
    total,
    draftCount,
    registeredCount,
    collectedCount,
    bouncedCount,
    overdueCount,
    totalInboundPending: Number(totalInboundAgg._sum.amount || 0),
    totalOutboundPending: Number(totalOutboundAgg._sum.amount || 0)
  };
}