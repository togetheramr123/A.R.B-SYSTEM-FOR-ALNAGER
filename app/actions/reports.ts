"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { safeDecimal } from '@/lib/utils/numberUtils';
import fs from 'fs';
export async function getProfitAndLossReport(startDate?: string, endDate?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }
  try {
    const targetTypes = ['income', 'other_income', 'expense', 'cost_of_goods_sold', 'depreciation'];
    const accounts = await prisma.account.findMany({
      where: {
        companyId: session.companyId,
        type: {
          in: targetTypes
        }
      },
      include: {
        journalItems: {
          where: Object.keys(dateFilter).length > 0 ? {
            entry: {
              state: 'posted',
              date: dateFilter
            }
          } : {
            entry: {
              state: 'posted'
            }
          }
        }
      }
    });
    const report = {
      operatingIncome: [] as any[],
      costOfRevenue: [] as any[],
      operatingExpenses: [] as any[],
      totals: {
        operatingIncome: new Decimal(0),
        costOfRevenue: new Decimal(0),
        grossProfit: new Decimal(0),
        operatingExpenses: new Decimal(0),
        netProfit: new Decimal(0)
      }
    };
    for (const account of accounts) {
      let sumDebit = new Decimal(0);
      let sumCredit = new Decimal(0);
      for (const item of account.journalItems) {
        sumDebit = sumDebit.plus(safeDecimal(item.debit) as any);
        sumCredit = sumCredit.plus(safeDecimal(item.credit) as any);
      }
      let balance = new Decimal(0);
      const isIncome = ['income', 'other_income'].includes(account.type);
      if (isIncome) {
        balance = sumCredit.minus(sumDebit);
      } else {
        balance = sumDebit.minus(sumCredit);
      }
      if (balance.isZero()) continue;
      const accData = {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        balance: balance.toNumber()
      };
      if (isIncome) {
        report.operatingIncome.push(accData);
        report.totals.operatingIncome = report.totals.operatingIncome.plus(balance);
      } else if (account.type === 'cost_of_goods_sold') {
        report.costOfRevenue.push(accData);
        report.totals.costOfRevenue = report.totals.costOfRevenue.plus(balance);
      } else {
        report.operatingExpenses.push(accData);
        report.totals.operatingExpenses = report.totals.operatingExpenses.plus(balance);
      }
    }
    return {
      operatingIncome: report.operatingIncome.sort((a, b) => a.code.localeCompare(b.code)),
      costOfRevenue: report.costOfRevenue.sort((a, b) => a.code.localeCompare(b.code)),
      operatingExpenses: report.operatingExpenses.sort((a, b) => a.code.localeCompare(b.code)),
      totals: {
        operatingIncome: report.totals.operatingIncome.toNumber(),
        costOfRevenue: report.totals.costOfRevenue.toNumber(),
        grossProfit: report.totals.grossProfit.toNumber(),
        operatingExpenses: report.totals.operatingExpenses.toNumber(),
        netProfit: report.totals.netProfit.toNumber()
      }
    };
  } catch (e) {
    console.error("P&L Report Error:", e);
    throw e;
  }
}
export async function getServerPivotData(dims: string[], measure: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  var session = await getSession();
  if (!session) return [];
  try {
    const sales = await prisma.saleOrder.findMany({
      where: {
        companyId: session.companyId
      },
      include: {
        user: true
      }
    });
    return sales.map((s: any) => {
      const date = new Date(s.dateOrder);
      return {
        salesperson: (s.user as any)?.name || 'Unknown',
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        status: s.status,
        subtotal: Number(s.amountTotal || 0)
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}
export async function getPartnerLedgerData(filters: {
  startDate?: string;
  endDate?: string;
  partnerIds?: string[];
  accountIds?: string[];
  journalIds?: string[];
  reconciled?: boolean;
  accountTypes?: string[];
  tags?: string[];
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const itemWhere: any = {
      account: {
        companyId: session.companyId
      }
    };
    if (filters.partnerIds && filters.partnerIds.length > 0) {
      itemWhere.OR = [{
        partnerId: {
          in: filters.partnerIds
        }
      }, {
        entry: {
          partnerId: {
            in: filters.partnerIds
          }
        }
      }];
    } else {
      itemWhere.OR = [{
        partnerId: {
          not: null
        }
      }, {
        entry: {
          partnerId: {
            not: null
          }
        }
      }];
    }
    if (filters.accountIds && filters.accountIds.length > 0) {
      itemWhere.accountId = {
        in: filters.accountIds
      };
    }
    const targetTypes = filters.accountTypes && filters.accountTypes.length > 0 ? filters.accountTypes : ['receivable', 'payable'];
    itemWhere.account = {
      ...itemWhere.account,
      type: {
        in: targetTypes
      }
    };
    if (filters.journalIds && filters.journalIds.length > 0) {
      itemWhere.entry = {
        ...itemWhere.entry,
        journalId: {
          in: filters.journalIds
        }
      };
    }
    if (filters.tags && filters.tags.length > 0) {
      const partnersWithTags = await prisma.partner.findMany({
        where: {
          companyId: session.companyId,
          tags: {
            some: {
              id: {
                in: filters.tags
              }
            }
          }
        },
        select: {
          id: true
        }
      });
      const tagPartnerIds = partnersWithTags.map((p: any) => p.id);
      if (itemWhere.OR) {
        itemWhere.OR[0].partnerId = {
          in: tagPartnerIds
        };
        itemWhere.OR[1].entry.partnerId = {
          in: tagPartnerIds
        };
      }
    }
    ;
    const allItems = await prisma.journalItem.findMany({
      where: {
        ...itemWhere,
        entry: {
          ...itemWhere.entry,
          state: 'posted'
        }
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true
          }
        },
        account: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true
          }
        },
        entry: {
          select: {
            id: true,
            name: true,
            date: true,
            partnerId: true,
            partner: {
              select: {
                id: true,
                name: true
              }
            },
            journal: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        entry: {
          date: 'asc'
        }
      }
    });
    const partnerMap = new Map<string, any>();
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
    startDate.setHours(0, 0, 0, 0);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date('2099-12-31');
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      const temp = new Date(startDate);
      startDate.setTime(endDate.getTime());
      startDate.setHours(0, 0, 0, 0);
      endDate.setTime(temp.getTime());
      endDate.setHours(23, 59, 59, 999);
    }
    for (const item of allItems) {
      const effectivePartnerId = item.partnerId || item.entry.partnerId;
      const effectivePartner = item.partner || item.entry.partner;
      if (!effectivePartnerId) continue;
      if (!partnerMap.has(effectivePartnerId)) {
        partnerMap.set(effectivePartnerId, {
          partner: effectivePartner,
          initialBalance: new Decimal(0),
          debit: new Decimal(0),
          credit: new Decimal(0),
          balance: new Decimal(0),
          lines: []
        });
      }
      const pData = partnerMap.get(effectivePartnerId);
      if (!pData) continue;
      const itemDate = new Date(item.entry.date);
      const debit = safeDecimal(item.debit as any);
      const credit = safeDecimal(item.credit as any);
      const net = debit.minus(credit);
      if (itemDate < startDate) {
        pData.initialBalance = pData.initialBalance.plus(net);
      } else if (itemDate <= endDate) {
        pData.debit = pData.debit.plus(debit);
        pData.credit = pData.credit.plus(credit);
        pData.lines.push({
          id: item.id,
          date: item.entry.date.toISOString(),
          entryName: item.entry.name,
          journalName: item.entry.journal?.name,
          accountCode: item.account.code,
          accountName: item.account.name,
          name: item.name,
          debit: debit.toNumber(),
          credit: credit.toNumber(),
          net: net.toNumber(),
          balance: 0 // Will be calculated
        });
      }
    }

    const result = [];
    const specificPartnersRequested = filters.partnerIds && filters.partnerIds.length > 0;
    if (specificPartnersRequested) {
      const requestedPartners = await prisma.partner.findMany({
        where: {
          id: {
            in: filters.partnerIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      for (const rp of requestedPartners) {
        if (!partnerMap.has(rp.id)) {
          partnerMap.set(rp.id, {
            partner: rp,
            initialBalance: new Decimal(0),
            debit: new Decimal(0),
            credit: new Decimal(0),
            balance: new Decimal(0),
            lines: []
          });
        }
      }
    }
    for (const [_, pData] of partnerMap.entries()) {
      pData.balance = pData.initialBalance.plus(pData.debit).minus(pData.credit);
      const isExplicitlyRequested = specificPartnersRequested && filters.partnerIds!.includes(pData.partner.id);
      if (pData.lines.length > 0 || !pData.balance.isZero() || !pData.initialBalance.isZero() || isExplicitlyRequested) {
        let runningBalance = pData.initialBalance;
        for (const line of pData.lines) {
          runningBalance = runningBalance.plus(line.net);
          line.balance = runningBalance.toNumber();
        }
        result.push({
          partner: pData.partner,
          initialBalance: pData.initialBalance.toNumber(),
          debit: pData.debit.toNumber(),
          credit: pData.credit.toNumber(),
          balance: pData.balance.toNumber(),
          lines: pData.lines
        });
      }
    }
    return result;
  } catch (e: any) {
    console.error("Partner Ledger Error:", e);
    throw e;
  }
}
export async function getLedgerFilterOptions() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("account_move", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const journals = await prisma.journal.findMany({
      where: {
        companyId: session.companyId
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true
      }
    });
    const accounts = await prisma.account.findMany({
      where: {
        companyId: session.companyId
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true
      }
    });
    const partners = await prisma.partner.findMany({
      where: {
        companyId: session.companyId
      },
      select: {
        id: true,
        name: true,
        type: true,
        tags: true
      }
    });
    const allTags = new Map<string, string>();
    partners.forEach((p: any) => p.tags.forEach((t: any) => allTags.set(t.id, t.name)));
    return {
      journals,
      accounts,
      partners: partners.map((p: any) => ({
        id: p.id,
        name: p.name
      })),
      tags: Array.from(allTags.entries()).map(([id, name]) => ({
        id,
        name
      })),
      accountTypes: Array.from(new Set(accounts.map((a: any) => a.type)))
    };
  } catch (e) {
    console.error(e);
    return {
      journals: [],
      accounts: [],
      partners: [],
      tags: [],
      accountTypes: []
    };
  }
}