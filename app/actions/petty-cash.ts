"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { ensureAccess } from "@/lib/access";
import { getCompanyId } from "@/lib/getCompanyId";
import { logAuditAction } from "@/app/actions/audit"; /** * Create a Petty Cash / Miscellaneous Expense entry. * This creates both a Payment record and its Journal Entry in one step. */
export async function createPettyCashExpense(data: {
  description: string;
  amount: number;
  date: string;
  expenseAccountId: string;
  journalId: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "create");
  const companyId = await getCompanyId();
  return await prisma.$transaction(async tx => {
    // 1. Generate sequential name
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await tx.payment.count({
      where: {
        paymentType: "outbound",
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });
    const name = `PETTY/${yearMonth}/${String(count + 1).padStart(4, "0")}`; // 2. Get cash journal and its default account (cash account);
    const journal = await tx.journal.findUnique({
      where: {
        id: data.journalId
      },
      include: {
        defaultAccount: true
      }
    });
    if (!journal || !journal.defaultAccount) {
      throw new Error("الدفتر المختار ليس له حساب نقدي افتراضي");
    } // 3. Create payment record
    const payment = await tx.payment.create({
      data: {
        name,
        paymentType: "outbound",
        partnerType: "supplier",
        amount: data.amount,
        date: new Date(data.date),
        ref: `نثرية: ${data.description}`,
        journalId: data.journalId,
        state: "posted",
        companyId
      }
    }); // 4. Create journal entry: Dr Expense / Cr Cash
    await tx.journalEntry.create({
      data: {
        name: `${journal.code}/${name}`,
        date: new Date(data.date),
        journalId: data.journalId,
        paymentId: payment.id,
        state: "posted",
        ref: `نثرية: ${data.description}`,
        items: {
          create: [{
            accountId: data.expenseAccountId,
            name: data.description,
            debit: data.amount,
            credit: 0
          }, {
            accountId: journal.defaultAccount.id,
            name: data.description,
            debit: 0,
            credit: data.amount
          }]
        }
      }
    });

    await logAuditAction({
      action: "create",
      model: "pettyCash",
      recordId: payment.id,
      recordName: payment.name,
      newValues: { amount: data.amount, description: data.description, journalId: data.journalId, expenseAccountId: data.expenseAccountId },
    });

    try {
      revalidatePath("/accounting/payments");
    } catch (error) { console.error("Silent error caught in app/actions/petty-cash.ts:", error); }
    return {
      success: true,
      payment
    };
  });
} /** * Get expense accounts for the petty cash dropdown. */
export async function getExpenseAccounts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return prisma.account.findMany({
    where: {
      type: {
        in: ["expense", "cost_of_revenue", "depreciation"]
      }
    },
    orderBy: {
      code: "asc"
    },
    select: {
      id: true,
      code: true,
      name: true
    }
  });
} /** * Get cash journals for the petty cash dropdown. */
export async function getCashJournals() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return prisma.journal.findMany({
    where: {
      type: "cash"
    },
    include: {
      defaultAccount: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}