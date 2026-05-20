"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getCompanyPrisma } from '@/lib/prismaCompany';
import { getSession } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
export async function getAgedPartnerBalance(type: 'receivable' | 'payable' | 'all' = 'receivable', dateArg?: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const date = dateArg ? new Date(dateArg) : new Date();
  const accountTypes = type === 'all' ? ['receivable', 'payable'] : [type];
  const items = await prisma.journalItem.findMany({
    where: {
      account: {
        type: {
          in: accountTypes
        }
      },
      entry: {
        date: {
          lte: date
        }
      }
    },
    include: {
      account: true,
      entry: {
        include: {
          partner: true,
          invoice: true
        }
      }
    }
  });
  const partnerMap = new Map<string, any>();
  for (const item of items) {
    const partner = item.entry.partner;
    if (!partner) continue;
    const partnerId = partner.id;
    let pData = partnerMap.get(partnerId);
    if (!pData) {
      pData = {
        id: partnerId,
        name: partner.name || 'Unknown',
        total: new Decimal(0),
        not_due: new Decimal(0),
        range_0_30: new Decimal(0),
        range_30_60: new Decimal(0),
        range_60_90: new Decimal(0),
        range_90_plus: new Decimal(0)
      };
      partnerMap.set(partnerId, pData);
    }
    const balance = new Decimal(item.balance || 0);
    const dueDateRaw = item.entry.invoice?.dateDue || item.entry.date;
    const dueDate = new Date(dueDateRaw);
    const diffTime = date.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    pData.total = pData.total.plus(balance);
    if (diffDays <= 0) {
      pData.not_due = pData.not_due.plus(balance);
    } else if (diffDays <= 30) {
      pData.range_0_30 = pData.range_0_30.plus(balance);
    } else if (diffDays <= 60) {
      pData.range_30_60 = pData.range_30_60.plus(balance);
    } else if (diffDays <= 90) {
      pData.range_60_90 = pData.range_60_90.plus(balance);
    } else {
      pData.range_90_plus = pData.range_90_plus.plus(balance);
    }
  }
  const reportData = Array.from(partnerMap.values()).map(p => ({
    ...p,
    total: p.total.toNumber(),
    not_due: p.not_due.toNumber(),
    range_0_30: p.range_0_30.toNumber(),
    range_30_60: p.range_30_60.toNumber(),
    range_60_90: p.range_60_90.toNumber(),
    range_90_plus: p.range_90_plus.toNumber()
  })).filter(p => Math.abs(p.total) > 0.01).sort((a, b) => b.total - a.total);
  return reportData;
}
export async function getProfitLoss(from: Date, to: Date) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

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
              gte: from,
              lte: to
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
              gte: from,
              lte: to
            },
            state: 'posted'
          }
        }
      }
    }
  });
  const formatAccountLine = (acc: any, invert: boolean) => {
    const balance = acc.journalItems.reduce((sum: Decimal, item: any) => {
      const debit = new Decimal(item.debit || 0);
      const credit = new Decimal(item.credit || 0);
      return sum.plus(debit.minus(credit));
    }, new Decimal(0));
    if (balance.abs().lt(0.01)) return null;
    return {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      balance: invert ? balance.negated().toNumber() : balance.toNumber()
    };
  };
  const income = incomeAccounts.map(a => formatAccountLine(a, true)).filter((i): i is NonNullable<typeof i> => i !== null);
  const expenses = expenseAccounts.map(a => formatAccountLine(a, false)).filter((i): i is NonNullable<typeof i> => i !== null);
  const totalIncome = income.reduce((sum: number, line: any) => sum + line.balance, 0);
  const totalExpenses = expenses.reduce((sum: number, line: any) => sum + line.balance, 0);
  return {
    income,
    expenses,
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses
  };
}
export async function getBalanceSheet(options?: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const date = options?.endDate ? new Date(options.endDate) : new Date();
  const fiscalYearStart = new Date(date.getFullYear(), 0, 1);
  const plOptions = {
    ...options,
    startDate: fiscalYearStart.toISOString()
  };
  const pl = await getProfitLoss(plOptions, session);
  const currentYearEarnings = pl.netProfit;
  const assetTypes = ['asset', 'receivable', 'bank', 'cash', 'current_asset', 'fixed_asset'];
  const liabilityTypes = ['liability', 'payable', 'current_liability', 'credit_card'];
  const equityTypes = ['equity'];
  const whereClause: any = {
    date: {
      lte: date
    }
  };
  if (options?.targetState === 'posted') {
    whereClause.state = 'posted';
  }
  if (options?.journals && options.journals.length > 0) {
    whereClause.journalId = {
      in: options.journals
    };
  }
  const cprisma = await getCompanyPrisma();
  const getGroup = async (types: string[], invert: boolean) => {
    const accounts = await cprisma.account.findMany({
      where: {
        type: {
          in: types
        }
      },
      include: {
        journalItems: {
          where: {
            entry: whereClause
          }
        }
      }
    });
    return accounts.map(a => {
      const sums = a.journalItems.reduce((acc, item: any) => {
        const d = new Decimal(item.debit || 0);
        const c = new Decimal(item.credit || 0);
        return {
          debit: acc.debit.plus(d),
          credit: acc.credit.plus(c)
        };
      }, {
        debit: new Decimal(0),
        credit: new Decimal(0)
      });
      const balance = sums.debit.minus(sums.credit);
      if (balance.abs().lt(0.01)) return null;
      return {
        accountId: a.id,
        code: a.code,
        name: a.name,
        debit: sums.debit.toNumber(),
        credit: sums.credit.toNumber(),
        balance: invert ? balance.negated().toNumber() : balance.toNumber()
      };
    }).filter((i): i is NonNullable<typeof i> => i !== null);
  };
  const assets = await getGroup(assetTypes, false);
  const liabilities = await getGroup(liabilityTypes, true);
  const equity = await getGroup(equityTypes, true);
  const totalAssets = assets.reduce((sum: number, line: any) => sum + line.balance, 0);
  const totalLiabilities = liabilities.reduce((sum: number, line: any) => sum + line.balance, 0);
  const totalEquity = equity.reduce((sum: number, line: any) => sum + line.balance, 0);
  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalEquityAndLiabilities: totalLiabilities + totalEquity + currentYearEarnings,
    currentYearEarnings
  };
}
export async function getGeneralLedger(accountId: string | undefined, from: Date, to: Date) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const companyId = session?.companyId;
  let accounts: any[] = [];
  if (accountId) {
    const account = await prisma.account.findUnique({
      where: {
        id: accountId
      }
    });
    if (account) accounts.push(account);
  } else {
    accounts = await prisma.account.findMany({
      where: companyId ? {
        companyId
      } : {},
      orderBy: {
        code: 'asc'
      }
    });
  }
  const reportData = [];
  for (const account of accounts) {
    const initialAgg = await prisma.journalItem.aggregate({
      where: {
        accountId: account.id,
        entry: {
          date: {
            lt: from
          },
          state: 'posted',
          ...(companyId ? {
            company: {
              id: companyId
            }
          } : {})
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    const initDebit = new Decimal(initialAgg._sum.debit || 0);
    const initCredit = new Decimal(initialAgg._sum.credit || 0);
    const initialBalance = initDebit.minus(initCredit);
    const items = await prisma.journalItem.findMany({
      where: {
        accountId: account.id,
        entry: {
          date: {
            gte: from,
            lte: to
          },
          state: 'posted',
          ...(companyId ? {
            company: {
              id: companyId
            }
          } : {})
        }
      },
      include: {
        entry: {
          include: {
            partner: true
          }
        }
      },
      orderBy: {
        entry: {
          date: 'asc'
        }
      }
    });
    if (items.length === 0 && initialBalance.isZero()) continue;
    reportData.push({
      id: account.id,
      code: account.code,
      name: account.name,
      initialBalance: initialBalance.toNumber(),
      items: items.map(item => ({
        id: item.id,
        date: item.entry.date,
        name: item.name || item.entry.name,
        ref: item.entry.ref,
        partner: item.entry.partner?.name,
        debit: new Decimal(item.debit || 0).toNumber(),
        credit: new Decimal(item.credit || 0).toNumber(),
        balance: new Decimal(item.balance || 0).toNumber()
      }))
    });
  }
  return reportData;
}
export async function getTrialBalance(from?: Date, to?: Date) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const companyId = session?.companyId;
  let endDate = new Date();
  if (to) {
    endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
  }
  const accounts = await prisma.account.findMany({
    where: companyId ? {
      companyId
    } : {},
    orderBy: {
      code: 'asc'
    }
  });
  const reportData = [];
  for (const account of accounts) {
    let initialDebit = new Decimal(0);
    let initialCredit = new Decimal(0);
    if (from) {
      const initialAgg = await prisma.journalItem.aggregate({
        where: {
          accountId: account.id,
          entry: {
            date: {
              lt: from
            },
            state: 'posted',
            ...(companyId ? {
              company: {
                id: companyId
              }
            } : {})
          }
        },
        _sum: {
          debit: true,
          credit: true
        }
      });
      initialDebit = new Decimal(initialAgg._sum.debit || 0);
      initialCredit = new Decimal(initialAgg._sum.credit || 0);
    }
    const movementAgg = await prisma.journalItem.aggregate({
      where: {
        accountId: account.id,
        entry: {
          date: {
            gte: from || new Date(0),
            lte: endDate
          },
          state: 'posted',
          ...(companyId ? { company: { id: companyId } } : {})
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    
    const debit = new Decimal(movementAgg._sum.debit || 0);
    const credit = new Decimal(movementAgg._sum.credit || 0);
    const initialBalance = initialDebit.minus(initialCredit);
    const endingBalance = initialBalance.plus(debit).minus(credit);
    
    reportData.push({
      accountId: account.id,
      code: account.code,
      name: account.name,
      initialBalance: initialBalance.toNumber(),
      debit: debit.toNumber(),
      credit: credit.toNumber(),
      balance: endingBalance.toNumber()
    });
  }
  return reportData;
}
export async function getPartnerLedger(partnerId: string | undefined, from: Date, to: Date, accountType: 'receivable' | 'payable' | 'all' = 'all', includeReconciled: boolean = true) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const companyId = session?.companyId;
  let partners: any[] = [];
  if (partnerId) {
    const partner = await prisma.partner.findUnique({
      where: {
        id: partnerId
      }
    });
    if (partner) partners.push(partner);
  } else {
    partners = await prisma.partner.findMany({
      where: companyId ? {
        companyId
      } : {},
      orderBy: {
        name: 'asc'
      }
    });
  }
  const accountTypes = accountType === 'all' ? ['receivable', 'payable'] : [accountType];
  const reportData = [];
  for (const partner of partners) {
    const initialAgg = await prisma.journalItem.aggregate({
      where: {
        entry: {
          partnerId: partner.id,
          date: {
            lt: from
          },
          state: 'posted',
          ...(companyId ? {
            company: {
              id: companyId
            }
          } : {})
        },
        account: {
          type: {
            in: accountTypes
          }
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    const initDebit = new Decimal(initialAgg._sum.debit || 0);
    const initCredit = new Decimal(initialAgg._sum.credit || 0);
    const initialBalance = initDebit.minus(initCredit);
    const items = await prisma.journalItem.findMany({
      where: {
        entry: {
          partnerId: partner.id,
          date: {
            gte: from,
            lte: to
          },
          state: 'posted',
          ...(companyId ? {
            company: {
              id: companyId
            }
          } : {})
        },
        account: {
          type: {
            in: accountTypes
          }
        }
      },
      include: {
        entry: true,
        account: true
      },
      orderBy: {
        entry: {
          date: 'asc'
        }
      }
    });
    if (items.length === 0 && initialBalance.equals(0)) continue;
    const mappedItems = items.map(item => ({
      id: item.id,
      date: item.entry.date,
      name: item.name || item.entry.name,
      ref: item.entry.ref,
      accountCode: item.account.code,
      accountName: item.account.name,
      debit: new Decimal(item.debit || 0).toNumber(),
      credit: new Decimal(item.credit || 0).toNumber(),
      balance: new Decimal(item.balance || 0).toNumber()
    }));
    reportData.push({
      id: partner.id,
      name: partner.name,
      initialBalance: initialBalance.toNumber(),
      items: mappedItems,
      totalDebit: mappedItems.reduce((sum, item) => sum + item.debit, 0) + (initialBalance.isPositive() ? initialBalance.toNumber() : 0),
      totalCredit: mappedItems.reduce((sum, item) => sum + item.credit, 0) + (initialBalance.isNegative() ? initialBalance.abs().toNumber() : 0),
      endingBalance: initialBalance.toNumber() + mappedItems.reduce((sum, item) => sum + item.debit - item.credit, 0)
    });
  }
  return reportData;
}
export async function getTaxReport(from: Date, to: Date) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const companyId = session?.companyId;
  const taxItems = await prisma.journalItem.findMany({
    where: {
      account: {
        OR: [{
          name: {
            contains: 'Tax'
          }
        }, {
          type: {
            in: ['current_liability', 'current_asset']
          },
          name: {
            contains: 'Tax'
          }
        }]
      },
      entry: {
        date: {
          gte: from,
          lte: to
        },
        state: 'posted',
        ...(companyId ? {
          companyId
        } : {})
      }
    },
    include: {
      account: true
    }
  });
  const report = {
    outputTax: new Decimal(0),
    inputTax: new Decimal(0),
    netTax: new Decimal(0),
    details: [] as any[]
  };
  const accountSummary = new Map<string, any>();
  for (const item of taxItems) {
    const isLiability = ['liability', 'current_liability'].includes(item.account.type);
    const amount = new Decimal(item.credit || 0).minus(item.debit || 0);
    let accData = accountSummary.get(item.accountId);
    if (!accData) {
      accData = {
        name: item.account.name,
        code: item.account.code,
        amount: new Decimal(0),
        type: isLiability ? 'output' : 'input'
      };
      accountSummary.set(item.accountId, accData);
    }
    accData.amount = accData.amount.plus(amount);
    if (isLiability) {
      report.outputTax = report.outputTax.plus(amount);
    } else {
      const inputAmt = new Decimal(item.debit || 0).minus(item.credit || 0);
      report.inputTax = report.inputTax.plus(inputAmt);
    }
  }
  return {
    outputTax: report.outputTax.toNumber(),
    inputTax: report.inputTax.toNumber(),
    netTax: report.outputTax.minus(report.inputTax).toNumber(),
    details: Array.from(accountSummary.values()).map(a => ({
      ...a,
      amount: a.amount.toNumber()
    }))
  };
}
export async function getCashFlowStatement(from: Date, to: Date) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const cashItems = await prisma.journalItem.findMany({
    where: {
      account: {
        type: {
          in: ['bank', 'cash']
        }
      },
      entry: {
        date: {
          gte: from,
          lte: to
        },
        state: 'posted'
      }
    },
    include: {
      entry: {
        include: {
          items: {
            include: {
              account: true
            }
          }
        }
      }
    }
  });
  const groups = {
    operating: new Decimal(0),
    investing: new Decimal(0),
    financing: new Decimal(0)
  };
  for (const item of cashItems) {
    const amount = new Decimal(item.debit || 0).minus(item.credit || 0);
    const counterparts = item.entry.items.filter(i => i.id !== item.id);
    for (const cp of counterparts) {
      const cpType = cp.account.type;
      let group: 'operating' | 'investing' | 'financing' = 'operating';
      if (['fixed_asset'].includes(cpType)) group = 'investing';
      if (['equity', 'liability', 'current_liability'].includes(cpType)) {
        if (cpType === 'equity' || cp.account.name.toLowerCase().includes('loan')) group = 'financing';
      }
      groups[group] = groups[group].plus(amount.div(counterparts.length || 1));
    }
  }
  return {
    operating: groups.operating.toNumber(),
    investing: groups.investing.toNumber(),
    financing: groups.financing.toNumber(),
    netIncrease: groups.operating.plus(groups.investing).plus(groups.financing).toNumber()
  };
}
export async function getComparativeProfitLoss(currentFrom: Date, currentTo: Date, previousFrom: Date, previousTo: Date) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const [current, previous] = await Promise.all([getProfitLoss(currentFrom, currentTo), getProfitLoss(previousFrom, previousTo)]);
  const allIncomeAccounts = new Set([...current.income.map((l: any) => l.accountId), ...previous.income.map((l: any) => l.accountId)]);
  const incomeComparison = Array.from(allIncomeAccounts).map(accId => {
    const cur = current.income.find((l: any) => l.accountId === accId);
    const prev = previous.income.find((l: any) => l.accountId === accId);
    const currentBalance = cur?.balance || 0;
    const previousBalance = prev?.balance || 0;
    const change = currentBalance - previousBalance;
    const changePct = previousBalance !== 0 ? change / Math.abs(previousBalance) * 100 : currentBalance !== 0 ? 100 : 0;
    return {
      accountId: accId,
      code: cur?.code || prev?.code,
      name: cur?.name || prev?.name,
      currentBalance,
      previousBalance,
      change,
      changePct: Math.round(changePct * 10) / 10
    };
  });
  const allExpenseAccounts = new Set([...current.expenses.map((l: any) => l.accountId), ...previous.expenses.map((l: any) => l.accountId)]);
  const expenseComparison = Array.from(allExpenseAccounts).map(accId => {
    const cur = current.expenses.find((l: any) => l.accountId === accId);
    const prev = previous.expenses.find((l: any) => l.accountId === accId);
    const currentBalance = cur?.balance || 0;
    const previousBalance = prev?.balance || 0;
    const change = currentBalance - previousBalance;
    const changePct = previousBalance !== 0 ? change / Math.abs(previousBalance) * 100 : currentBalance !== 0 ? 100 : 0;
    return {
      accountId: accId,
      code: cur?.code || prev?.code,
      name: cur?.name || prev?.name,
      currentBalance,
      previousBalance,
      change,
      changePct: Math.round(changePct * 10) / 10
    };
  });
  const totalIncomeChange = current.totalIncome - previous.totalIncome;
  const totalExpenseChange = current.totalExpenses - previous.totalExpenses;
  const totalProfitChange = current.netProfit - previous.netProfit;
  return {
    income: incomeComparison,
    expenses: expenseComparison,
    current: {
      totalIncome: current.totalIncome,
      totalExpenses: current.totalExpenses,
      netProfit: current.netProfit
    },
    previous: {
      totalIncome: previous.totalIncome,
      totalExpenses: previous.totalExpenses,
      netProfit: previous.netProfit
    },
    changes: {
      income: totalIncomeChange,
      incomePct: previous.totalIncome ? Math.round(totalIncomeChange / Math.abs(previous.totalIncome) * 1000) / 10 : 0,
      expenses: totalExpenseChange,
      expensesPct: previous.totalExpenses ? Math.round(totalExpenseChange / Math.abs(previous.totalExpenses) * 1000) / 10 : 0,
      profit: totalProfitChange,
      profitPct: previous.netProfit ? Math.round(totalProfitChange / Math.abs(previous.netProfit) * 1000) / 10 : 0
    }
  };
}
export async function getCostCenterReport(from?: string, to?: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");
  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.lte = toDate;
  }
  const items = await prisma.journalItem.findMany({
    where: {
      analyticAccountId: {
        not: null
      },
      entry: {
        state: 'posted',
        ...(Object.keys(dateFilter).length ? {
          date: dateFilter
        } : {})
      }
    },
    include: {
      analyticAccount: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      account: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true
        }
      },
      entry: {
        select: {
          date: true,
          name: true
        }
      }
    }
  });
  const centerMap = new Map<string, {
    id: string;
    name: string;
    code: string | null;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    items: {
      date: any;
      entryName: string;
      accountName: string;
      debit: number;
      credit: number;
    }[];
  }>();
  for (const item of items) {
    if (!item.analyticAccount) continue;
    const key = item.analyticAccount.id;
    if (!centerMap.has(key)) {
      centerMap.set(key, {
        id: item.analyticAccount.id,
        name: item.analyticAccount.name,
        code: item.analyticAccount.code,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        items: []
      });
    }
    const center = centerMap.get(key)!;
    const debit = Number(item.debit);
    const credit = Number(item.credit);
    center.totalDebit += debit;
    center.totalCredit += credit;
    center.balance += debit - credit;
    center.items.push({
      date: item.entry.date,
      entryName: item.entry.name,
      accountName: item.account.name,
      debit,
      credit
    });
  }
  return Array.from(centerMap.values()).sort((a, b) => b.balance - a.balance);
}
export async function getPartnerStatement(partnerId: string, from?: string, to?: string, stateFilter: string = 'posted') {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.lte = toDate;
  }
  const partner = await prisma.partner.findUnique({
    where: {
      id: partnerId
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      vat: true,
      city: true,
      street: true
    }
  });
  if (!partner) throw new Error('العميل غير موجود');
  const company = await prisma.company.findFirst({
    select: {
      name: true,
      phone: true,
      email: true,
      address: true,
      taxId: true,
      logoUrl: true
    }
  });
  const items = await prisma.journalItem.findMany({
    where: {
      entry: {
        partnerId: partner.id,
        ...(stateFilter !== 'all' ? { state: 'posted' } : {}),
        ...(Object.keys(dateFilter).length ? {
          date: dateFilter
        } : {})
      },
      account: {
        type: {
          in: ['receivable', 'payable']
        }
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
          type: true
        }
      }
    },
    orderBy: {
      entry: {
        date: 'asc'
      }
    }
  });
  let openingBalance = 0;
  if (from) {
    const openingItems = await prisma.journalItem.findMany({
      where: {
        entry: {
          partnerId: partner.id,
          ...(stateFilter !== 'all' ? { state: 'posted' } : {}),
          date: {
            lt: new Date(from)
          }
        },
        account: {
          type: {
            in: ['receivable', 'payable']
          }
        }
      },
      select: {
        debit: true,
        credit: true
      }
    });
    openingBalance = openingItems.reduce((sum, i) => sum + Number(i.debit) - Number(i.credit), 0);
  }
  let runningBalance = openingBalance;
  const lines = items.map(item => {
    const debit = Number(item.debit);
    const credit = Number(item.credit);
    runningBalance += debit - credit;
    return {
      date: item.entry.date,
      ref: item.entry.name,
      description: item.entry.ref || '',
      debit,
      credit,
      balance: runningBalance
    };
  });
  const closingBalance = runningBalance;
  const unpostedCount = await prisma.journalEntry.count({
    where: {
      partnerId: partner.id,
      state: 'draft',
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
    }
  });
  return {
    partner,
    company,
    openingBalance,
    closingBalance,
    lines,
    totalDebit: lines.reduce((s, l) => s + l.debit, 0),
    totalCredit: lines.reduce((s, l) => s + l.credit, 0),
    from,
    to,
    printDate: new Date().toISOString(),
    hasUnpostedEntries: unpostedCount > 0,
    stateFilter
  };
}