"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';
import { getCompanyId } from '@/lib/getCompanyId';
import { revalidatePath } from 'next/cache';
import { logAuditAction } from '@/app/actions/audit';
async function getUnreconciledItems(partnerId: string, accountType: 'receivable' | 'payable' = 'receivable') {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'read');
  const items = await prisma.journalItem.findMany({
    where: {
      partnerId,
      entry: {
        state: 'posted'
      },
      account: {
        type: accountType
      }
    },
    include: {
      entry: {
        select: {
          name: true,
          date: true,
          ref: true
        }
      },
      account: {
        select: {
          name: true,
          code: true
        }
      }
    },
    orderBy: {
      entry: {
        date: 'asc'
      }
    }
  });
  return items.map((item: any) => ({
    id: item.id,
    entryName: item.entry.name,
    entryDate: item.entry.date,
    ref: item.entry.ref || item.name,
    accountCode: item.account.code,
    accountName: item.account.name,
    debit: Number(item.debit),
    credit: Number(item.credit),
    balance: Number(item.debit) - Number(item.credit)
  }));
}
export async function reconcileItems(itemIds: string[], toleranceAmount: number = 0.01) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'write');
  if (itemIds.length < 2) throw new Error('يجب اختيار قيدين على الأقل للتسوية');
  const companyId = await getCompanyId();
  try {
    const result = await prisma.$transaction(async tx => {
      const items = await tx.journalItem.findMany({
        where: {
          id: {
            in: itemIds
          }
        },
        include: {
          entry: {
            select: {
              state: true
            }
          },
          account: {
            select: {
              id: true,
              type: true
            }
          }
        }
      });
      if (items.length !== itemIds.length) {
        throw new Error('بعض القيود المحددة غير موجودة');
      }
      for (const item of items) {
        if (item.entry.state !== 'posted') {
          throw new Error('كل القيود يجب أن تكون مرحّلة');
        }
      }
      const accountTypes = new Set(items.map(i => i.account.type));
      if (accountTypes.size > 1) {
        throw new Error('كل القيود يجب أن تكون من نفس نوع الحساب');
      }
      let totalDebit = 0,
        totalCredit = 0;
      for (const item of items) {
        totalDebit += Number(item.debit);
        totalCredit += Number(item.credit);
      }
      const netBalance = Math.abs(totalDebit - totalCredit);
      if (netBalance > toleranceAmount && netBalance > 1) {
        throw new Error(`لا يمكن التسوية — فرق الرصيد ${netBalance.toFixed(2)} أكبر من المسموح. يجب أن يكون مجموع المدين مساوياً للدائن.`);
      }
      if (netBalance > 0.01 && netBalance <= toleranceAmount) {
        const writeOffAccount = (await tx.account.findFirst({
          where: {
            type: 'expense',
            name: {
              contains: 'فروقات'
            }
          }
        })) || (await tx.account.findFirst({
          where: {
            type: 'expense'
          }
        }));
        if (writeOffAccount) {
          const journal = await tx.journal.findFirst({
            where: {
              type: 'general'
            }
          });
          if (journal) {
            const accountId = items[0].account.id;
            await tx.journalEntry.create({
              data: {
                name: `REC/WO/${new Date().getTime()}`,
                date: new Date(),
                journalId: journal.id,
                ref: 'تسوية فروقات كسور',
                state: 'posted',
                companyId,
                createdById: session.userId,
                items: {
                  create: totalDebit > totalCredit ? [{
                    accountId,
                    name: 'فروقات تسوية',
                    debit: 0,
                    credit: netBalance,
                    companyId
                  }, {
                    accountId: writeOffAccount.id,
                    name: 'فروقات تسوية',
                    debit: netBalance,
                    credit: 0,
                    companyId
                  }] : [{
                    accountId,
                    name: 'فروقات تسوية',
                    debit: netBalance,
                    credit: 0,
                    companyId
                  }, {
                    accountId: writeOffAccount.id,
                    name: 'فروقات تسوية',
                    debit: 0,
                    credit: netBalance,
                    companyId
                  }]
                }
              }
            });
          }
        }
      }
      await logAuditAction({
        action: 'reconcile',
        model: 'JournalItem',
        recordId: itemIds.join(','),
        recordName: `تسوية ${items.length} قيود`,
        newValues: {
          totalDebit,
          totalCredit,
          netBalance,
          itemCount: items.length
        }
      });
      return {
        success: true,
        itemCount: items.length,
        totalDebit,
        totalCredit,
        netBalance,
        writeOffCreated: netBalance > 0.01
      };
    });
    revalidatePath('/[locale]/accounting');
    return result;
  } catch (error: any) {
    console.error('Reconciliation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
export async function calculateDueDate(paymentTermId: string, invoiceDate: string | Date): Promise<Date> {
  const term = await prisma.paymentTerm.findUnique({
    where: {
      id: paymentTermId
    },
    include: {
      lines: {
        orderBy: {
          sequence: 'asc'
        }
      }
    }
  });
  if (!term || !term.lines || term.lines.length === 0) {
    return new Date(invoiceDate);
  }
  const baseDate = new Date(invoiceDate);
  let latestDueDate = new Date(baseDate);
  for (const line of term.lines) {
    const lineDueDate = new Date(baseDate);
    if (line.days > 0) {
      lineDueDate.setDate(lineDueDate.getDate() + line.days);
    }
    if (line.dayOfMonth && line.dayOfMonth > 0) {
      lineDueDate.setDate(line.dayOfMonth);
      if (lineDueDate <= baseDate) {
        lineDueDate.setMonth(lineDueDate.getMonth() + 1);
      }
    }
    if (lineDueDate > latestDueDate) {
      latestDueDate = lineDueDate;
    }
  }
  return latestDueDate;
}
export async function calculatePaymentSchedule(paymentTermId: string, invoiceDate: string | Date, totalAmount: number) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const term = await prisma.paymentTerm.findUnique({
    where: {
      id: paymentTermId
    },
    include: {
      lines: {
        orderBy: {
          sequence: 'asc'
        }
      }
    }
  });
  if (!term || !term.lines || term.lines.length === 0) {
    return [{
      dueDate: new Date(invoiceDate),
      amount: totalAmount,
      label: 'مستحق فوراً'
    }];
  }
  const baseDate = new Date(invoiceDate);
  const schedule: {
    dueDate: Date;
    amount: number;
    label: string;
  }[] = [];
  let remaining = totalAmount;
  for (let i = 0; i < term.lines.length; i++) {
    const line = term.lines[i];
    const lineDueDate = new Date(baseDate);
    if (line.days > 0) {
      lineDueDate.setDate(lineDueDate.getDate() + line.days);
    }
    if (line.dayOfMonth && line.dayOfMonth > 0) {
      lineDueDate.setDate(line.dayOfMonth);
      if (lineDueDate <= baseDate) {
        lineDueDate.setMonth(lineDueDate.getMonth() + 1);
      }
    }
    let lineAmount: number;
    if (line.valueType === 'percent') {
      lineAmount = Math.round(totalAmount * Number(line.value) / 100 * 100) / 100;
    } else if (line.valueType === 'fixed') {
      lineAmount = Number(line.value);
    } else {
      lineAmount = remaining;
    }
    lineAmount = Math.min(lineAmount, remaining);
    remaining -= lineAmount;
    schedule.push({
      dueDate: lineDueDate,
      amount: lineAmount,
      label: line.valueType === 'balance' ? 'الرصيد المتبقي' : `${Number(line.value)}${line.valueType === 'percent' ? '%' : ' ج.م'}`
    });
  }
  if (remaining > 0.01 && schedule.length > 0) {
    schedule[schedule.length - 1].amount += remaining;
  }
  return schedule;
}
export async function getPaymentTerms() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.paymentTerm.findMany({
    where: {
      active: true
    },
    include: {
      lines: {
        orderBy: {
          sequence: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}