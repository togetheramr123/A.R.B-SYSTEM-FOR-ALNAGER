"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getClientDashboardData() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { partner: true },
  });

  if (!user) return null;

  // 1. Fetch Open Tickets
  const openTickets = await prisma.ticket.findMany({
    where: {
      creatorId: user.id,
      status: { in: ["open", "pending"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // 2. Fetch Recent Invoices (Posted only)
  let recentInvoices: any[] = [];
  let totalDue = 0;

  if (user.partnerId) {
    recentInvoices = await prisma.invoice.findMany({
      where: {
        partnerId: user.partnerId,
        type: "out_invoice",
        state: "posted",
      },
      orderBy: { dateInvoice: "desc" },
      take: 5,
    });

    // Calculate total due
    const invoices = await prisma.invoice.findMany({
      where: {
        partnerId: user.partnerId,
        type: "out_invoice",
        state: "posted",
      },
      select: { amountResidual: true },
    });
    totalDue = invoices.reduce((sum, inv) => sum + Number(inv.amountResidual || 0), 0);
  }

  return {
    openTickets,
    recentInvoices: recentInvoices.map((inv) => ({
      ...inv,
      amountTotal: Number(inv.amountTotal),
      amountResidual: Number(inv.amountResidual),
    })),
    totalDue,
    partnerId: user.partnerId,
  };
}

export async function requestAccountStatement() {
  const session = await getSession();
  if (!session?.userId) return { error: "غير مصرح" };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user?.partnerId) {
    return { error: "لم يتم ربط حسابك بشريك تجاري بعد. يرجى التواصل مع الإدارة." };
  }

  // Create statement request
  await prisma.accountStatementRequest.create({
    data: {
      partnerId: user.partnerId,
      status: "PENDING",
    },
  });

  return { success: true };
}
