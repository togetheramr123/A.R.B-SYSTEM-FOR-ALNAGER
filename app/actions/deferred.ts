"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';
import { getCompanyId } from '@/lib/getCompanyId';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';
import { logAuditAction } from '@/app/actions/audit';
async function createDeferredEntry(data: {
  name: string;
  type: 'deferred_revenue' | 'deferred_expense';
  totalAmount: number;
  startDate: string;
  endDate: string;
  sourceAccountId: string;
  targetAccountId: string;
  journalId?: string;
  invoiceId?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'create');
  const companyId = await getCompanyId();
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
  if (months < 1) throw new Error('الفترة يجب أن تكون شهر واحد على الأقل');
  const monthlyAmount = Math.round(data.totalAmount / months * 100) / 100;
  const remainder = Math.round((data.totalAmount - monthlyAmount * months) * 100) / 100;
  const lines: {
    periodDate: Date;
    amount: number;
  }[] = [];
  for (let i = 0; i < months; i++) {
    const periodDate = new Date(startDate);
    periodDate.setMonth(periodDate.getMonth() + i);
    periodDate.setDate(1);
    let amount = monthlyAmount;
    if (i === months - 1) amount += remainder;
    lines.push({ periodDate, amount });
  }

  const entry = await prisma.deferredEntry.create({
    data: {
      name: data.name,
      type: data.type,
      totalAmount: new Decimal(data.totalAmount),
      startDate,
      endDate,
      periods: months,
      sourceAccountId: data.sourceAccountId,
      targetAccountId: data.targetAccountId,
      journalId: data.journalId,
      invoiceId: data.invoiceId,
      status: 'draft',
      companyId,
      createdById: session.userId,
      lines: {
        create: lines.map(l => ({
          periodDate: l.periodDate,
          amount: new Decimal(l.amount),
          status: 'pending'
        }))
      }
    },
    include: {
      lines: true
    }
  });

  await logAuditAction({
    action: 'create',
    model: 'DeferredEntry',
    recordId: entry.id,
    recordName: data.name,
    newValues: {
      totalAmount: data.totalAmount,
      periods: months,
      type: data.type
    }
  });

  revalidatePath('/[locale]/accounting');
}
export async function activateDeferredEntry(id: string) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'write');
  const entry = await prisma.deferredEntry.findUnique({
    where: {
      id
    }
  });
  if (!entry) throw new Error('الإدخال المؤجل غير موجود');
  if (entry.status !== 'draft') throw new Error('الإدخال ليس في حالة مسودة');
  await prisma.deferredEntry.update({
    where: {
      id
    },
    data: {
      status: 'active'
    }
  });
  return {
    success: true
  };
}
export async function postDeferredPeriod(lineId: string) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'create');
  const companyId = await getCompanyId();
  const result = await prisma.$transaction(async tx => {
    const line = await tx.deferredEntryLine.findUnique({
      where: {
        id: lineId
      },
      include: {
        deferredEntry: true
      }
    });
    if (!line) throw new Error('السطر غير موجود');
    if (line.status === 'posted') throw new Error('هذه الفترة مرحّلة بالفعل');
    if (line.deferredEntry.status !== 'active') throw new Error('الإدخال المؤجل غير مفعّل');
    const entry = line.deferredEntry;
    const isRevenue = entry.type === 'deferred_revenue';
    const journal = entry.journalId ? await tx.journal.findUnique({
      where: {
        id: entry.journalId
      }
    }) : await tx.journal.findFirst({
      where: {
        type: 'general'
      }
    });
    if (!journal) throw new Error('لا يوجد دفتر يومية');
    const je = await tx.journalEntry.create({
      data: {
        name: `DEF/${entry.name}/${line.periodDate.toISOString().substring(0, 7)}`,
        date: line.periodDate,
        journalId: journal.id,
        ref: `${isRevenue ? 'إيراد' : 'مصروف'} مؤجل — ${entry.name}`,
        state: 'posted',
        companyId,
        createdById: session.userId,
        items: {
          create: [{
            accountId: entry.targetAccountId,
            name: `${entry.name} — ${line.periodDate.toISOString().substring(0, 7)}`,
            debit: isRevenue ? 0 : Number(line.amount),
            credit: isRevenue ? Number(line.amount) : 0,
            companyId
          }, {
            accountId: entry.sourceAccountId,
            name: `${entry.name} — ${line.periodDate.toISOString().substring(0, 7)}`,
            debit: isRevenue ? Number(line.amount) : 0,
            credit: isRevenue ? 0 : Number(line.amount),
            companyId
          }]
        }
      }
    });
    await tx.deferredEntryLine.update({
      where: {
        id: lineId
      },
      data: {
        status: 'posted',
        journalEntryId: je.id
      }
    });
    const pendingCount = await tx.deferredEntryLine.count({
      where: {
        deferredEntryId: entry.id,
        status: 'pending'
      }
    });
    if (pendingCount === 0) {
      await tx.deferredEntry.update({
        where: {
          id: entry.id
        },
        data: {
          status: 'completed'
        }
      });
    }
    return {
      success: true,
      journalEntryId: je.id
    };
  });
  revalidatePath('/[locale]/accounting');
  return result;
}
export async function postAllDueDeferredPeriods() {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'create');
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const pendingLines = await prisma.deferredEntryLine.findMany({
    where: {
      status: 'pending',
      periodDate: {
        lte: today
      },
      deferredEntry: {
        status: 'active'
      }
    }
  });
  let posted = 0;
  for (const line of pendingLines) {
    try {
      await postDeferredPeriod(line.id);
      posted++;
    } catch (e) {
      console.error(`Failed to post deferred line ${line.id}:`, e);
    }
  }
  return {
    success: true,
    postedCount: posted,
    totalPending: pendingLines.length
  };
}
export async function getDeferredEntries() {
  await ensureAccess('account_move', 'read');
  const entries = await prisma.deferredEntry.findMany({
    include: {
      lines: {
        orderBy: {
          periodDate: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return entries.map((e: any) => ({
    ...e,
    totalAmount: Number(e.totalAmount),
    lines: e.lines.map((l: any) => ({
      ...l,
      amount: Number(l.amount)
    }))
  }));
}
export async function getDeferredEntry(id: string) {
  await ensureAccess('account_move', 'read');
  const entry = await prisma.deferredEntry.findUnique({
    where: {
      id
    },
    include: {
      lines: {
        orderBy: {
          periodDate: 'asc'
        }
      }
    }
  });
  if (!entry) return null;
  return {
    ...entry,
    totalAmount: Number(entry.totalAmount),
    lines: entry.lines.map((l: any) => ({
      ...l,
      amount: Number(l.amount)
    }))
  };
}