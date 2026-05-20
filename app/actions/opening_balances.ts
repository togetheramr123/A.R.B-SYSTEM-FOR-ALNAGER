"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
type PartnerBalance = {
  partnerId: string;
  balance: number;
  type: 'receivable' | 'payable';
};
type RegisterBalance = {
  registerId: string;
  balance: number;
};
export async function saveOpeningBalances(data: {
  partners: PartnerBalance[];
  registers: RegisterBalance[];
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const { partners, registers } = data;
  var session = await getSession();
  if (!session?.companyId || !session?.userId) throw new Error('Unauthorized');
  let journal = await prisma.journal.findFirst({
    where: {
      companyId: session.companyId,
      type: 'general',
      code: 'OPN'
    }
  });
  if (!journal) {
    journal = await prisma.journal.create({
      data: {
        name: 'Opening Balances / أرصدة افتتاحية',
        code: 'OPN',
        type: 'general',
        companyId: session.companyId
      }
    });
  }
  const findOrCreateAccount = async (code: string, name: string, type: string) => {
    let acc = await prisma.account.findFirst({
      where: {
        companyId: session.companyId,
        code
      }
    });
    if (!acc) {
      acc = await prisma.account.create({
        data: {
          code,
          name,
          type,
          companyId: session.companyId
        }
      });
    }
    return acc;
  };
  const receivableAcc = await findOrCreateAccount('120000', 'Account Receivable', 'asset');
  const payableAcc = await findOrCreateAccount('210000', 'Account Payable', 'liability');
  const equityAcc = await findOrCreateAccount('310000', 'Opening Balance Equity', 'equity');
  let totalDebit = 0;
  let totalCredit = 0;
  const journalItems = [];
  for (const p of partners) {
    if (p.balance === 0) continue;
    const isDebit = p.balance > 0;
    const amount = Math.abs(p.balance);
    journalItems.push({
      name: 'رصيد افتتاحي (Opening Balance)',
      accountId: p.type === 'receivable' ? receivableAcc.id : payableAcc.id,
      partnerId: p.partnerId,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount
    });
    if (isDebit) totalDebit += amount;else totalCredit += amount;
  }
  for (const reg of registers) {
    if (reg.balance === 0) continue;
    const registerRecord = await prisma.cashRegister.findUnique({
      where: {
        id: reg.registerId
      }
    });
    let cashAccId = registerRecord?.accountId;
    if (!cashAccId) {
      const tempAcc = await findOrCreateAccount(`100${reg.registerId.slice(-3)}`, `Cash - ${registerRecord?.name}`, 'asset');
      cashAccId = tempAcc.id;
    }
    const isDebit = reg.balance > 0;
    const amount = Math.abs(reg.balance);
    journalItems.push({
      name: `رصيد افتتاحي لخزينة: ${registerRecord?.name}`,
      accountId: cashAccId,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount
    });
    if (isDebit) totalDebit += amount;else totalCredit += amount;
  }
  const difference = totalDebit - totalCredit;
  if (difference !== 0) {
    const isEquityCredit = difference > 0;
    const balanceAmount = Math.abs(difference);
    journalItems.push({
      name: 'موازنة الأرصدة الافتتاحية (Equity Balancing)',
      accountId: equityAcc.id,
      debit: isEquityCredit ? 0 : balanceAmount,
      credit: isEquityCredit ? balanceAmount : 0
    });
  }
  if (journalItems.length === 0) {
    throw new Error('لا توجد أرصدة لإدخالها');
  }
  const entry = await prisma.journalEntry.create({
    data: {
      name: `OPN/${new Date().getFullYear()}/0001`,
      date: new Date(),
      companyId: session.companyId,
      journalId: journal.id,
      ref: 'Opening Balances',
      state: 'posted',
      createdById: session.userId,
      items: {
        create: journalItems
      }
    }
  });
  return entry;
}
export async function getOpeningBalancesData() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session?.companyId) return {
    partners: [],
    registers: []
  };
  const partners = await prisma.partner.findMany({
    where: {
      companyId: session.companyId
    },
    select: {
      id: true,
      name: true,
      type: true
    }
  });
  const registers = await prisma.cashRegister.findMany({
    where: {
      companyId: session.companyId
    },
    select: {
      id: true,
      name: true
    }
  });
  return {
    partners,
    registers
  };
}