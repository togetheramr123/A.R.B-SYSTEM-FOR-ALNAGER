"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';
import { Decimal } from '@prisma/client/runtime/library';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';
export async function getBudgets() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.budget.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 100
  });
}
export async function getBudget(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === 'new') return null;
  return await prisma.budget.findUnique({
    where: {
      id
    },
    include: {
      lines: {
        include: {
          analyticAccount: true,
          generalAccount: true
        }
      }
    }
  });
}
export async function createBudget(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('budget', 'create');
  const budget = await prisma.budget.create({
    data: {
      name: data.name,
      userId: data.userId,
      dateFrom: new Date(data.dateFrom),
      dateTo: new Date(data.dateTo),
      companyId: await getCompanyId()
    }
  });
  revalidatePath('/accounting/reporting/budgets');
  return budget;
}
export async function updateBudget(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('budget', 'write');
  const budget = await prisma.budget.update({
    where: {
      id
    },
    data: {
      name: data.name,
      userId: data.userId,
      dateFrom: new Date(data.dateFrom),
      dateTo: new Date(data.dateTo),
      state: data.state
    }
  });
  revalidatePath('/accounting/reporting/budgets');
  revalidatePath(`/accounting/reporting/budgets/${id}`);
  return budget;
}
export async function deleteBudget(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('budget', 'unlink');
  await prisma.budget.delete({
    where: {
      id
    }
  });
  revalidatePath('/accounting/reporting/budgets');
}
export async function createBudgetLine(budgetId: string, data: any) {
  await ensureAccess('budget', 'write');
  await prisma.budgetLine.create({
    data: {
      budgetId,
      analyticAccountId: data.analyticAccountId,
      generalAccountId: data.generalAccountId,
      dateFrom: new Date(data.dateFrom),
      dateTo: new Date(data.dateTo),
      plannedAmount: new Decimal(data.plannedAmount || 0)
    }
  });
  revalidatePath(`/accounting/reporting/budgets/${budgetId}`);
}
export async function updateBudgetLine(id: string, data: any) {
  await ensureAccess('budget', 'write');
  await prisma.budgetLine.update({
    where: {
      id
    },
    data: {
      analyticAccountId: data.analyticAccountId,
      generalAccountId: data.generalAccountId,
      dateFrom: new Date(data.dateFrom),
      dateTo: new Date(data.dateTo),
      plannedAmount: new Decimal(data.plannedAmount || 0)
    }
  });
}
export async function deleteBudgetLine(id: string) {
  await ensureAccess('budget', 'write');
  await prisma.budgetLine.delete({
    where: {
      id
    }
  });
}
export async function computeBudget(budgetId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const budget = await prisma.budget.findUnique({
    where: {
      id: budgetId
    },
    include: {
      lines: true
    }
  });
  if (!budget) return;
  for (const line of budget.lines) {
    const where: any = {
      date: {
        gte: line.dateFrom,
        lte: line.dateTo
      },
      entry: {
        state: 'posted'
      }
    };
    if (line.analyticAccountId) {
      where.analyticAccountId = line.analyticAccountId;
    }
    if (line.generalAccountId) {
      where.accountId = line.generalAccountId;
    }
    const aggregates = await prisma.journalItem.aggregate({
      where,
      _sum: {
        debit: true,
        credit: true
      }
    });
    const debit = aggregates._sum.debit ? new Decimal(aggregates._sum.debit) : new Decimal(0);
    const credit = aggregates._sum.credit ? new Decimal(aggregates._sum.credit) : new Decimal(0);
    const practicalAmount = debit.minus(credit);
    const totalDuration = line.dateTo.getTime() - line.dateFrom.getTime();
    const elapsed = Date.now() - line.dateFrom.getTime();
    let theoreticalAmount = new Decimal(0);
    if (totalDuration > 0 && elapsed > 0) {
      const ratio = Math.min(1, Math.max(0, elapsed / totalDuration));
      theoreticalAmount = line.plannedAmount.mul(ratio);
    }
    let percentage = new Decimal(0);
    if (!line.plannedAmount.isZero()) {
      percentage = practicalAmount.div(line.plannedAmount).mul(100);
    }
    await prisma.budgetLine.update({
      where: {
        id: line.id
      },
      data: {
        practicalAmount,
        theoreticalAmount,
        percentage
      }
    });
  }
  revalidatePath(`/accounting/reporting/budgets/${budgetId}`);
}