"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getCompanyId } from '@/lib/getCompanyId';
import { Decimal } from '@prisma/client/runtime/library';
import { revalidatePath } from 'next/cache';
export async function previewYearEndClosing(fiscalYear: number) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");
  const yearStart = new Date(fiscalYear, 0, 1);
  const yearEnd = new Date(fiscalYear, 11, 31, 23, 59, 59, 999);
  const existing = await prisma.fiscalYearClosing.findFirst({
    where: {
      fiscalYear,
      status: 'confirmed'
    }
  });
  if (existing) {
    return {
      error: `السنة المالية ${fiscalYear} مقفلة بالفعل.`,
      existing
    };
  }
  const incomeAccounts = await prisma.account.findMany({
    where: {
      type: {
        in: ['income', 'other_income']
      }
    },
    include: {
      journalItems: {
        where: {
          entry: {
            date: {
              gte: yearStart,
              lte: yearEnd
            },
            state: 'posted'
          }
        }
      }
    }
  });
  const expenseAccounts = await prisma.account.findMany({
    where: {
      type: {
        in: ['expense', 'cost_of_revenue']
      }
    },
    include: {
      journalItems: {
        where: {
          entry: {
            date: {
              gte: yearStart,
              lte: yearEnd
            },
            state: 'posted'
          }
        }
      }
    }
  });
  const incomeLines: {
    accountId: string;
    code: string;
    name: string;
    balance: number;
  }[] = [];
  const expenseLines: {
    accountId: string;
    code: string;
    name: string;
    balance: number;
  }[] = [];
  let totalIncome = new Decimal(0);
  let totalExpenses = new Decimal(0);
  for (const acc of incomeAccounts) {
    let balance = new Decimal(0);
    for (const item of acc.journalItems) {
      balance = balance.plus(new Decimal(item.credit || 0)).minus(new Decimal(item.debit || 0));
    }
    if (balance.abs().gt(0.01)) {
      incomeLines.push({
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        balance: balance.toNumber()
      });
      totalIncome = totalIncome.plus(balance);
    }
  }
  for (const acc of expenseAccounts) {
    let balance = new Decimal(0);
    for (const item of acc.journalItems) {
      balance = balance.plus(new Decimal(item.debit || 0)).minus(new Decimal(item.credit || 0));
    }
    if (balance.abs().gt(0.01)) {
      expenseLines.push({
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        balance: balance.toNumber()
      });
      totalExpenses = totalExpenses.plus(balance);
    }
  }
  const netProfit = totalIncome.minus(totalExpenses);
  return {
    fiscalYear,
    incomeLines,
    expenseLines,
    totalIncome: totalIncome.toNumber(),
    totalExpenses: totalExpenses.toNumber(),
    netProfit: netProfit.toNumber(),
    isProfit: netProfit.gte(0)
  };
}
export async function performYearEndClosing(fiscalYear: number) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') {
    throw new Error('إقفال السنة المالية متاح للمدير فقط');
  }
  const companyId = await getCompanyId();
  try {
    const result = await prisma.$transaction(async tx => {
      const existing = await tx.fiscalYearClosing.findFirst({
        where: {
          fiscalYear,
          companyId,
          status: 'confirmed'
        }
      });
      if (existing) throw new Error(`السنة المالية ${fiscalYear} مقفلة بالفعل`);
      const yearStart = new Date(fiscalYear, 0, 1);
      const yearEnd = new Date(fiscalYear, 11, 31, 23, 59, 59, 999);
      const incomeAccounts = await tx.account.findMany({
        where: {
          type: {
            in: ['income', 'other_income']
          }
        },
        include: {
          journalItems: {
            where: {
              entry: {
                date: {
                  gte: yearStart,
                  lte: yearEnd
                },
                state: 'posted'
              }
            }
          }
        }
      });
      const expenseAccounts = await tx.account.findMany({
        where: {
          type: {
            in: ['expense', 'cost_of_revenue']
          }
        },
        include: {
          journalItems: {
            where: {
              entry: {
                date: {
                  gte: yearStart,
                  lte: yearEnd
                },
                state: 'posted'
              }
            }
          }
        }
      });
      const closingItems: {
        accountId: string;
        name: string;
        debit: number;
        credit: number;
      }[] = [];
      let totalIncome = new Decimal(0);
      let totalExpenses = new Decimal(0);
      for (const acc of incomeAccounts) {
        let balance = new Decimal(0);
        for (const item of acc.journalItems) {
          balance = balance.plus(new Decimal(item.credit || 0)).minus(new Decimal(item.debit || 0));
        }
        if (balance.abs().gt(0.01)) {
          closingItems.push({ accountId: acc.id, name: acc.name, debit: balance.toNumber(), credit: 0 });
        }
        totalIncome = totalIncome.plus(balance);
      }
      for (const acc of expenseAccounts) {
        let balance = new Decimal(0);
        for (const item of acc.journalItems) {
          balance = balance.plus(new Decimal(item.debit || 0)).minus(new Decimal(item.credit || 0));
        }
        if (balance.abs().gt(0.01)) {
          closingItems.push({ accountId: acc.id, name: acc.name, debit: 0, credit: balance.toNumber() });
        }
        totalExpenses = totalExpenses.plus(balance);
      }
      const netProfit = totalIncome.minus(totalExpenses);
      if (closingItems.length === 0) {
        throw new Error('لا توجد أرصدة لإقفالها في هذه السنة');
      }
      let retainedEarningsAcc = await tx.account.findFirst({
        where: {
          type: 'equity',
          name: {
            contains: 'أرباح'
          }
        }
      });
      if (!retainedEarningsAcc) {
        retainedEarningsAcc = await tx.account.create({
          data: {
            code: '301001',
            name: 'الأرباح المحتجزة',
            type: 'equity',
            companyId
          }
        });
      }
      if (netProfit.gt(0)) {
        closingItems.push({
          accountId: retainedEarningsAcc.id,
          name: `صافي ربح ${fiscalYear}`,
          debit: 0,
          credit: netProfit.toNumber()
        });
      } else if (netProfit.lt(0)) {
        closingItems.push({
          accountId: retainedEarningsAcc.id,
          name: `صافي خسارة ${fiscalYear}`,
          debit: netProfit.abs().toNumber(),
          credit: 0
        });
      }
      let journal = await tx.journal.findFirst({
        where: {
          type: 'general'
        }
      });
      if (!journal) {
        journal = await tx.journal.create({
          data: {
            name: 'قيود عامة',
            code: 'MISC',
            type: 'general',
            companyId
          }
        });
      }
      const entry = await tx.journalEntry.create({
        data: {
          name: `CLOSE/${fiscalYear}`,
          date: yearEnd,
          journalId: journal.id,
          ref: `قيد إقفال السنة المالية ${fiscalYear}`,
          state: 'posted',
          companyId,
          createdById: session.userId,
          items: {
            create: closingItems
          }
        }
      });
      const closing = await tx.fiscalYearClosing.create({
        data: {
          fiscalYear,
          closingDate: new Date(),
          totalIncome: totalIncome.toNumber(),
          totalExpenses: totalExpenses.toNumber(),
          netProfit: netProfit.toNumber(),
          closingEntryId: entry.id,
          status: 'confirmed',
          performedById: session.userId,
          companyId
        }
      });
      await tx.company.updateMany({
        where: companyId ? {
          id: companyId
        } : {},
        data: {
          fiscalYearLockDate: yearEnd
        }
      });
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          userName: user.name,
          action: 'close_year',
          model: 'FiscalYearClosing',
          recordId: closing.id,
          recordName: `إقفال ${fiscalYear}`,
          newValues: JSON.stringify({
            totalIncome: totalIncome.toNumber(),
            totalExpenses: totalExpenses.toNumber(),
            netProfit: netProfit.toNumber()
          }),
          companyId
        }
      });
      const users = await tx.user.findMany({
        where: {
          role: 'ADMIN'
        }
      });
      for (const u of users) {
        await tx.notification.create({
          data: {
            userId: u.id,
            title: `🔒 إقفال السنة المالية ${fiscalYear}`,
            message: `تم إقفال السنة المالية ${fiscalYear} بصافي ${netProfit.gte(0) ? 'ربح' : 'خسارة'} ${netProfit.abs().toNumber().toLocaleString('ar-EG')} ج.م بواسطة ${user.name}.`,
            type: 'INFO',
            companyId
          }
        });
      }
      return { success: true, netProfit: netProfit.toNumber() };
    });
    revalidatePath('/[locale]/accounting');
    return result;
  } catch (error: any) {
    console.error('Year-End Closing failed:', error);
    return { success: false, error: error.message };
  }
}
export async function reverseYearEndClosing(fiscalYear: number) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') {
    throw new Error('عكس الإقفال متاح للمدير فقط');
  }
  try {
    const result = await prisma.$transaction(async tx => {
      const closing = await tx.fiscalYearClosing.findFirst({
        where: {
          fiscalYear,
          status: 'confirmed'
        }
      });
      if (!closing) throw new Error('لا يوجد إقفال مؤكد لهذه السنة');
      if (closing.closingEntryId) {
        await tx.journalItem.deleteMany({
          where: {
            entryId: closing.closingEntryId
          }
        });
        await tx.journalEntry.delete({
          where: {
            id: closing.closingEntryId
          }
        }).catch(() => {});
      }
      await tx.fiscalYearClosing.update({
        where: {
          id: closing.id
        },
        data: {
          status: 'reversed'
        }
      });
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          userName: user.name,
          action: 'reverse_close_year',
          model: 'FiscalYearClosing',
          recordId: closing.id,
          recordName: `عكس إقفال ${fiscalYear}`,
          companyId: closing.companyId
        }
      });
      return {
        success: true
      };
    });
    revalidatePath('/[locale]/accounting');
    return result;
  } catch (error: any) {
    console.error('Reverse Year-End Closing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
export async function getYearEndClosings() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.fiscalYearClosing.findMany({
    orderBy: {
      fiscalYear: 'desc'
    }
  });
}
export async function setPeriodLockDate(lockDate: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') {
    throw new Error('تعديل قفل الفترة متاح للمدير فقط');
  }
  const companyId = await getCompanyId();
  const date = new Date(lockDate);
  date.setHours(23, 59, 59, 999);
  await prisma.company.updateMany({
    where: companyId ? {
      id: companyId
    } : {},
    data: {
      periodLockDate: date
    }
  });
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      userName: user.name,
      action: 'lock',
      model: 'Company',
      recordId: companyId || 'all',
      recordName: `قفل الفترة حتى ${lockDate}`,
      newValues: JSON.stringify({
        periodLockDate: lockDate
      }),
      companyId
    }
  });
  revalidatePath('/[locale]/settings');
  return {
    success: true
  };
}
export async function setAdvisorLockDate(lockDate: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') {
    throw new Error('قفل المدير المالي متاح للمدير فقط');
  }
  const companyId = await getCompanyId();
  const date = new Date(lockDate);
  date.setHours(23, 59, 59, 999);
  await prisma.company.updateMany({
    where: companyId ? {
      id: companyId
    } : {},
    data: {
      advisorLockDate: date
    }
  });
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      userName: user.name,
      action: 'lock',
      model: 'Company',
      recordId: companyId || 'all',
      recordName: `قفل المدير المالي حتى ${lockDate}`,
      newValues: JSON.stringify({
        advisorLockDate: lockDate
      }),
      companyId
    }
  });
  revalidatePath('/[locale]/settings');
  return {
    success: true
  };
}
export async function removePeriodLockDate() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') {
    throw new Error('متاح للمدير فقط');
  }
  const companyId = await getCompanyId();
  await prisma.company.updateMany({
    where: companyId ? {
      id: companyId
    } : {},
    data: {
      periodLockDate: null
    }
  });
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      userName: user.name,
      action: 'unlock',
      model: 'Company',
      recordId: companyId || 'all',
      recordName: 'إزالة قفل الفترة',
      companyId
    }
  });
  revalidatePath('/[locale]/settings');
  return {
    success: true
  };
}
export async function getLockSettings() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const companyId = await getCompanyId();
  const company = await prisma.company.findFirst({
    where: companyId ? {
      id: companyId
    } : {},
    select: {
      fiscalYearLockDate: true,
      periodLockDate: true,
      advisorLockDate: true
    }
  });
  return company || {
    fiscalYearLockDate: null,
    periodLockDate: null,
    advisorLockDate: null
  };
}
export async function checkPeriodLock(date: Date, userId: string): Promise<void> {
  const companyId = await getCompanyId();
  const company = await prisma.company.findFirst({
    where: companyId ? {
      id: companyId
    } : {},
    select: {
      fiscalYearLockDate: true,
      periodLockDate: true,
      advisorLockDate: true
    }
  });
  if (!company) return;
  const targetDate = new Date(date);
  if (company.advisorLockDate && targetDate <= company.advisorLockDate) {
    const lockStr = company.advisorLockDate.toLocaleDateString('ar-EG');
    throw new Error(`🔒 قفل المدير المالي: لا يمكن إنشاء أو تعديل قيود بتاريخ ${targetDate.toLocaleDateString('ar-EG')} — الفترة مقفلة حتى ${lockStr}`);
  }
  if (company.fiscalYearLockDate && targetDate <= company.fiscalYearLockDate) {
    const lockStr = company.fiscalYearLockDate.toLocaleDateString('ar-EG');
    throw new Error(`🔒 قفل السنة المالية: لا يمكن إنشاء أو تعديل قيود بتاريخ ${targetDate.toLocaleDateString('ar-EG')} — السنة مقفلة حتى ${lockStr}`);
  }
  if (company.periodLockDate && targetDate <= company.periodLockDate) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        role: true
      }
    });
    if (!user || user.role !== 'ADMIN') {
      const lockStr = company.periodLockDate.toLocaleDateString('ar-EG');
      throw new Error(`🔒 قفل الفترة: لا يمكن إنشاء أو تعديل قيود بتاريخ ${targetDate.toLocaleDateString('ar-EG')} — الفترة مقفلة حتى ${lockStr}. تواصل مع المدير.`);
    }
  }
}