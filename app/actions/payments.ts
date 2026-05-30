"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCompanyId } from "@/lib/getCompanyId";
import { getSession } from "@/lib/auth";
import { logTrackingChanges } from "@/app/actions/chatter";
import { ensureAccess } from "@/lib/access";
import { logAuditAction } from "@/app/actions/audit";
import { CreatePaymentSchema } from "@/lib/schemas";
import { ok, fail } from "@/lib/actionResult";
export async function getPayment(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === "new") return null;
  const payment = await prisma.payment.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      journal: {
        include: {
          defaultAccount: true
        }
      }
    }
  });
  if (!payment) return null;
  return {
    ...payment,
    amount: Number(payment.amount)
  };
}
export async function getAllPayments(type?: "inbound" | "outbound" | "all") {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const where = type && type !== "all" ? {
    paymentType: type
  } : {};
  const payments = await prisma.payment.findMany({
    where,
    include: {
      partner: true,
      journal: true
    },
    orderBy: {
      date: "desc"
    },
    take: 200
  });
  /* Serialize Decimal fields for Client Components */
  return payments.map((p: any) => ({
    ...p,
    amount: Number(p.amount)
  }));
}
export async function createPayment(data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "create");
  const parsed = CreatePaymentSchema.safeParse(data);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || "بيانات غير صالحة");
  }
  return await prisma.$transaction(async tx => {
    /* Atomic sequential naming */const prefix = data.paymentType === "inbound" ? "R/" : "P/";
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await tx.payment.count({
      where: {
        paymentType: data.paymentType,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });
    const name = `${prefix}${yearMonth}/${String(count + 1).padStart(4, "0")}`;
    const payment = await tx.payment.create({
      data: {
        name,
        paymentType: data.paymentType,
        partnerType: data.partnerType,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        ref: data.ref,
        partnerId: data.partnerId,
        journalId: data.journalId,
        destinationAccountId: data.destinationAccountId || null,
        state: "draft",
        companyId: data.companyId || (await getCompanyId())
      }
    });
    await logAuditAction({
      action: 'create',
      model: 'payment',
      recordId: payment.id,
      recordName: payment.name,
      newValues: { name: payment.name, paymentType: data.paymentType, amount: data.amount, state: 'draft' },
    });

    try {
      revalidatePath("/accounting/payments");
    } catch (error) { console.error("Silent error caught in app/actions/payments.ts:", error); }
    return payment;
  });
}
export async function confirmPayment(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("payment", "write");
  await prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({
      where: {
        id
      },
      include: {
        journal: {
          include: {
            defaultAccount: true
          }
        },
        partner: true
      }
    });
    if (!payment) throw new Error("Payment not found");
    if (payment.state !== "draft") throw new Error("Payment already posted");
    if (!payment.journal.defaultAccount) {
      throw new Error("Journal has no default account (Bank/Cash Account).");
    }
    const bankAccount = payment.journal.defaultAccount;
    let partnerAccount;
    if (payment.paymentType === "inbound") {
      partnerAccount = await tx.account.findFirst({
        where: {
          type: "receivable"
        }
      });
    } else {
      partnerAccount = await tx.account.findFirst({
        where: {
          type: "payable"
        }
      });
    }
    if (!partnerAccount) throw new Error("No Receivable/Payable account found in system.");
    const isReceipt = payment.paymentType === "inbound";
    const debitAccount = isReceipt ? bankAccount : partnerAccount;
    const creditAccount = isReceipt ? partnerAccount : bankAccount;
    /* Create Journal Entry atomically */
    await tx.journalEntry.create({
      data: {
        name: `${payment.journal.code}/${payment.name}`,
        date: payment.date,
        journalId: payment.journalId,
        partnerId: payment.partnerId,
        paymentId: payment.id,
        state: "posted",
        items: {
          create: [{
            accountId: debitAccount.id,
            name: payment.ref || payment.name,
            debit: payment.amount,
            credit: 0
          }, {
            accountId: creditAccount.id,
            name: payment.ref || payment.name,
            debit: 0,
            credit: payment.amount
          }]
        }
      }
    });
    /* Update payment state atomically */
    await tx.payment.update({
      where: {
        id
      },
      data: {
        state: "posted"
      }
    });
    /* Auto-reconcile: find matching invoice and apply payment */
    if (payment.ref && payment.ref.startsWith("Payment for ")) {
      const invoiceName = payment.ref.replace("Payment for ", "");
      const invoice = await tx.invoice.findFirst({
        where: {
          name: invoiceName,
          state: { in: ["posted", "partial"] }
        }
      });
      if (invoice) {
        const paymentAmount = Number(payment.amount);
        const currentResidual = Number(invoice.amountResidual);
        const newResidual = Math.max(0, currentResidual - paymentAmount);
        const newState = newResidual <= 0.01 ? "paid" : "partial";
        await tx.invoice.update({
          where: {
            id: invoice.id
          },
          data: {
            state: newState,
            amountResidual: Math.round(newResidual * 100) / 100
          }
        });
      }
    }
    
    await logTrackingChanges('payment', id, [{
      fieldName: 'state',
      fieldDesc: 'الحالة',
      oldValue: 'مسودة',
      newValue: 'مرحل'
    }]);

    await logAuditAction({
      action: 'confirm',
      model: 'payment',
      recordId: id,
      recordName: payment.name,
      oldValues: { state: 'draft' },
      newValues: { state: 'posted' },
    });

  });
  try {
    revalidatePath(`/accounting/payments/${id}`);
  } catch (error) { console.error("Silent error caught in app/actions/payments.ts:", error); }
}