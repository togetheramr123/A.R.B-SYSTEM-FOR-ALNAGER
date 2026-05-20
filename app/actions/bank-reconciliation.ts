"use server";
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';
import { Decimal } from '@prisma/client/runtime/library';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';

export interface BankTransaction {
  id: string; date: string; name: string; amount: number; partnerName?: string; ref?: string;
}

export async function fetchMockBankTransactions(journalId: string): Promise<BankTransaction[]> {
  var session = await getSession();
  if (!session) return [];
  await new Promise(resolve => setTimeout(resolve, 1000));
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: `TRANS-${Date.now()}-1`, date: today, name: "Bank Fee", amount: -15.00, ref: "FEE/001" },
    { id: `TRANS-${Date.now()}-2`, date: today, name: "Customer Payment - AL KAWTHAR", amount: 1200.00, partnerName: "AL KAWTHAR", ref: "INV/2025/001" },
    { id: `TRANS-${Date.now()}-3`, date: today, name: "Office Supplies Depot", amount: -150.50, partnerName: "Office Supplies Depot" },
    { id: `TRANS-${Date.now()}-4`, date: today, name: "Unknown Transfer", amount: 500.00, ref: "WIRE/999" },
  ];
}

export async function getBankStatements() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.bankStatement.findMany({ orderBy: { date: 'desc' }, include: { journal: true } });
}

export async function getBankStatement(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === 'new') return null;
  return await prisma.bankStatement.findUnique({ where: { id }, include: { journal: true, lines: { include: { partner: true, journalItems: true } } } });
}

export async function createBankStatement(data: any) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'create');
  let balanceStart = new Decimal(data.balanceStart || 0);
  let balanceEnd = new Decimal(data.balanceEnd || 0);
  let linesCreate: any[] = [];

  if (data.transactions && Array.isArray(data.transactions)) {
    if (!data.balanceStart) {
      const journal = await prisma.journal.findUnique({ where: { id: data.journalId }, include: { bankStatements: { orderBy: { date: 'desc' }, take: 1 } } });
      const lastStatement = journal?.bankStatements[0];
      balanceStart = lastStatement ? new Decimal(lastStatement.balanceEnd) : new Decimal(0);
    }
    let totalChange = new Decimal(0);
    linesCreate = data.transactions.map((t: any) => {
      const amount = new Decimal(t.amount);
      totalChange = totalChange.plus(amount);
      return { date: new Date(t.date), name: t.name, amount: amount };
    });
    balanceEnd = balanceStart.plus(totalChange);
  }

  const now = new Date();
  const bnkCount = await prisma.bankStatement.count({ where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } });
  const statement = await prisma.bankStatement.create({
    data: {
      name: data.name || `BNK/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(bnkCount + 1).padStart(4, '0')}`,
      date: new Date(data.date || new Date()),
      journalId: data.journalId,
      balanceStart, balanceEnd, balanceReal: balanceEnd,
      companyId: session.companyId, state: 'open',
      lines: { create: linesCreate.length > 0 ? linesCreate : undefined },
    },
    include: { lines: true },
  });
  try { revalidatePath('/accounting/reconciliation'); } catch (error) { console.error("Silent error caught in app/actions/bank-reconciliation.ts:", error); }
  return statement;
}

export async function updateBankStatement(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const statement = await prisma.bankStatement.update({
    where: { id },
    data: { name: data.name, date: new Date(data.date), journalId: data.journalId, balanceStart: new Decimal(data.balanceStart || 0), balanceEnd: new Decimal(data.balanceEnd || 0), state: data.state },
  });
  try { revalidatePath(`/accounting/reconciliation/${id}`); } catch (error) { console.error("Silent error caught in app/actions/bank-reconciliation.ts:", error); }
  return statement;
}

export async function addBankStatementLine(statementId: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  await prisma.bankStatementLine.create({
    data: { statementId, date: new Date(data.date), name: data.name, amount: new Decimal(data.amount || 0), partnerId: data.partnerId, companyId: await getCompanyId() },
  });
  try { revalidatePath(`/accounting/reconciliation/${statementId}`); } catch (error) { console.error("Silent error caught in app/actions/bank-reconciliation.ts:", error); }
}

export async function reconcileWithExistingItems(lineId: string, itemIds: string[]) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'write');
  await prisma.$transaction(async (tx) => {
    await tx.journalItem.updateMany({ where: { id: { in: itemIds } }, data: { bankStatementLineId: lineId } });
    await tx.bankStatementLine.update({ where: { id: lineId }, data: { isReconciled: true } });
  });
  try { revalidatePath('/accounting/reconciliation'); } catch (error) { console.error("Silent error caught in app/actions/bank-reconciliation.ts:", error); }
}

export async function reconcileDirectly(lineId: string, accountId: string, name: string) {
  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await ensureAccess('account_move', 'write');
  const line = await prisma.bankStatementLine.findUnique({ where: { id: lineId }, include: { statement: { include: { journal: true } } } });
  if (!line) throw new Error("Statement line not found");
  await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        name: `BNK/REC/${line.id.substring(0, 8)}`, ref: line.name, date: line.date,
        journalId: line.statement.journalId, state: 'posted', companyId: line.companyId,
        items: {
          create: [
            { name: line.name, accountId: line.statement.journal.defaultAccountId || accountId, debit: line.amount.greaterThan(0) ? line.amount : 0, credit: line.amount.lessThan(0) ? line.amount.abs() : 0, companyId: line.companyId },
            { name: name || line.name, accountId: accountId, debit: line.amount.lessThan(0) ? line.amount.abs() : 0, credit: line.amount.greaterThan(0) ? line.amount : 0, companyId: line.companyId },
          ],
        },
      },
      include: { items: true },
    });
    await tx.journalItem.updateMany({ where: { entryId: entry.id }, data: { bankStatementLineId: lineId } });
    await tx.bankStatementLine.update({ where: { id: lineId }, data: { isReconciled: true } });
  });
  try { revalidatePath('/accounting/reconciliation'); } catch (error) { console.error("Silent error caught in app/actions/bank-reconciliation.ts:", error); }
}

export async function autoReconcile(statementId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const statement = await prisma.bankStatement.findUnique({
    where: { id: statementId },
    include: { lines: { where: { isReconciled: { not: true } } }, journal: true },
  });
  if (!statement || !statement.journal.defaultAccountId) return;
  const bankAccountId = statement.journal.defaultAccountId;
  let matchedCount = 0;
  for (const line of statement.lines) {
    const amount = new Decimal(line.amount);
    const isPositive = amount.isPositive();
    const absAmount = amount.abs();
    const candidate = await prisma.journalItem.findFirst({
      where: {
        accountId: bankAccountId, bankStatementLineId: null,
        entry: { state: 'posted' },
        OR: [
          { debit: isPositive ? absAmount : new Decimal(0) },
          { credit: !isPositive ? absAmount : new Decimal(0) },
        ],
      },
      include: { entry: { include: { partner: true } } },
    });
    if (candidate) {
      await prisma.$transaction(async (tx) => {
        await tx.journalItem.update({ where: { id: candidate.id }, data: { bankStatementLineId: line.id } });
        await tx.bankStatementLine.update({ where: { id: line.id }, data: { isReconciled: true, partnerId: candidate.entry.partnerId || undefined } });
      });
      matchedCount++;
    }
  }
  try { revalidatePath(`/accounting/reconciliation/${statementId}`); } catch (error) { console.error("Silent error caught in app/actions/bank-reconciliation.ts:", error); }
  return matchedCount;
}

export async function getReconciliationCandidates(query?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return await prisma.journalItem.findMany({
    where: {
      bankStatementLineId: null,
      entry: { state: 'posted' },
      OR: query ? [
        { name: { contains: query } },
        { entry: { name: { contains: query } } },
        { entry: { ref: { contains: query } } },
      ] : undefined,
    },
    include: { entry: { include: { journal: true, partner: true } }, account: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}