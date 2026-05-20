"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureAccess } from "@/lib/access";

export interface PLOptions {
  startDate?: string;
  endDate?: string;
  targetState?: 'posted' | 'all';
  journals?: string[];
}
export async function getProfitAndLoss(options?: PLOptions) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  var session = await getSession();
  if (!session) return {
    income: [],
    totalIncome: 0,
    cogs: [],
    totalCogs: 0,
    grossProfit: 0,
    expenses: [],
    totalExpenses: 0,
    netProfit: 0
  };
  try {
    const {
      startDate,
      endDate,
      targetState = 'posted',
      journals
    } = options || {};
    const accounts = await prisma.account.findMany();
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.date = {
        lte: new Date(endDate)
      };
    }
    if (targetState === 'posted') {
      whereClause.state = 'posted';
    }
    if (journals && journals.length > 0) {
      whereClause.journalId = {
        in: journals
      };
    }
    const aggregations = await prisma.journalItem.groupBy({
      by: ['accountId'],
      _sum: {
        debit: true,
        credit: true
      },
      where: Object.keys(whereClause).length > 0 ? {
        entry: whereClause
      } : undefined
    } as any);
    const balancesMap = new Map(aggregations.map(agg => [agg.accountId, {
      debit: Number(agg._sum?.debit || 0),
      credit: Number(agg._sum?.credit || 0)
    }]));
    const incomeAccs: any[] = [];
    const cogsAccs: any[] = [];
    const expenseAccs: any[] = [];
    let totalIncome = 0;
    let totalCogs = 0;
    let totalExpenses = 0;
    accounts.forEach(acc => {
      const sums = balancesMap.get(acc.id);
      if (!sums) return;
      if (acc.type === 'income' || acc.type === 'other_income') {
        const balance = sums.credit - sums.debit;
        if (balance !== 0) {
          incomeAccs.push({
            ...acc,
            balance,
            debit: sums.debit,
            credit: sums.credit
          });
          totalIncome += balance;
        }
      }
      if (acc.type === 'cost_of_revenue') {
        const balance = sums.debit - sums.credit;
        if (balance !== 0) {
          cogsAccs.push({
            ...acc,
            balance,
            debit: sums.debit,
            credit: sums.credit
          });
          totalCogs += balance;
        }
      }
      if (acc.type === 'expense' || acc.type === 'depreciation') {
        const balance = sums.debit - sums.credit;
        if (balance !== 0) {
          expenseAccs.push({
            ...acc,
            balance,
            debit: sums.debit,
            credit: sums.credit
          });
          totalExpenses += balance;
        }
      }
    });
    const grossProfit = totalIncome - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    return {
      income: incomeAccs,
      totalIncome,
      cogs: cogsAccs,
      totalCogs,
      grossProfit,
      expenses: expenseAccs,
      totalExpenses,
      netProfit
    };
  } catch (error) {
    console.error("Failed to generate P&L:", error);
    return {
      income: [],
      totalIncome: 0,
      cogs: [],
      totalCogs: 0,
      grossProfit: 0,
      expenses: [],
      totalExpenses: 0,
      netProfit: 0
    };
  }
}
export async function getTrialBalance(startDate?: string, endDate?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  var session = await getSession();
  if (!session) return {
    rows: [],
    totals: {
      initialBalance: 0,
      debit: 0,
      credit: 0,
      endBalance: 0
    }
  };
  try {
    const accounts = await prisma.account.findMany({
      orderBy: {
        code: 'asc'
      }
    });
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    let initialAggregations: any[] = [];
    if (start) {
      initialAggregations = await prisma.journalItem.groupBy({
        by: ['accountId'],
        _sum: {
          debit: true,
          credit: true
        },
        where: {
          entry: {
            date: {
              lt: start
            },
            state: 'posted'
          }
        }
      } as any);
    }
    const whereClause: any = {};
    if (start && end) {
      whereClause.date = {
        gte: start,
        lte: end
      };
    } else if (start) {
      whereClause.date = {
        gte: start
      };
    } else if (end) {
      whereClause.date = {
        lte: end
      };
    }
    whereClause.state = 'posted';
    const periodAggregations = await prisma.journalItem.groupBy({
      by: ['accountId'],
      _sum: {
        debit: true,
        credit: true
      },
      where: {
        entry: whereClause
      }
    } as any);
    const initialMap = new Map(initialAggregations.map(agg => [agg.accountId, {
      debit: Number(agg._sum?.debit || 0),
      credit: Number(agg._sum?.credit || 0)
    }]));
    const periodMap = new Map(periodAggregations.map(agg => [agg.accountId, {
      debit: Number(agg._sum?.debit || 0),
      credit: Number(agg._sum?.credit || 0)
    }]));
    const tbRows: any[] = [];
    let totalInitialBalance = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalEndBalance = 0;
    accounts.forEach(acc => {
      const initial = initialMap.get(acc.id) || {
        debit: 0,
        credit: 0
      };
      const period = periodMap.get(acc.id) || {
        debit: 0,
        credit: 0
      };
      const initialBalance = initial.debit - initial.credit;
      const endBalance = initialBalance + period.debit - period.credit;
      if (initialBalance !== 0 || period.debit !== 0 || period.credit !== 0 || endBalance !== 0) {
        tbRows.push({
          id: acc.id,
          code: acc.code,
          name: acc.name,
          initialBalance,
          debit: period.debit,
          credit: period.credit,
          endBalance
        });
        totalInitialBalance += initialBalance;
        totalPeriodDebit += period.debit;
        totalPeriodCredit += period.credit;
        totalEndBalance += endBalance;
      }
    });
    return {
      rows: tbRows,
      totals: {
        initialBalance: totalInitialBalance,
        debit: totalPeriodDebit,
        credit: totalPeriodCredit,
        endBalance: totalEndBalance
      }
    };
  } catch (error) {
    console.error("Failed to generate Trial Balance:", error);
    return {
      rows: [],
      totals: {
        initialBalance: 0,
        debit: 0,
        credit: 0,
        endBalance: 0
      }
    };
  }
}
