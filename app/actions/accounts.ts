"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getAccount(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === 'new') return null;
  return await prisma.account.findUnique({
    where: {
      id
    },
    include: {
      tags: true,
      defaultTaxes: true,
      allowedJournals: true,
      journalItems: {
        include: {
          entry: {
            include: {
              journal: true,
              partner: true
            }
          },
          product: true
        },
        orderBy: {
          entry: {
            date: 'desc'
          }
        },
        take: 100
      },
      _count: {
        select: {
          journalItems: true
        }
      }
    }
  });
}
export async function getAccountBalance(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const result = await prisma.journalItem.aggregate({
    where: {
      accountId: id
    },
    _sum: {
      debit: true,
      credit: true
    }
  });
  const debit = Number(result._sum.debit || 0);
  const credit = Number(result._sum.credit || 0);
  return {
    debit,
    credit,
    balance: debit - credit
  };
}
export async function getAllAccounts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.account.findMany({
    orderBy: {
      code: 'asc'
    }
  });
}
export async function createAccount(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const {
    getCompanyId
  } = await import('@/lib/getCompanyId');
  const {
    generateAccountCode
  } = await import('@/lib/autoCode');
  const code = data.code || (await generateAccountCode(data.type));
  const tagConnections = data.tags ? data.tags.map((tagId: string) => ({
    id: tagId
  })) : [];
  const taxConnections = data.defaultTaxes ? data.defaultTaxes.map((taxId: string) => ({
    id: taxId
  })) : [];
  const journalConnections = data.allowedJournals ? data.allowedJournals.map((jId: string) => ({
    id: jId
  })) : [];
  try {
    const account = await prisma.account.create({
      data: {
        code,
        name: data.name,
        type: data.type,
        deprecated: data.deprecated || false,
        tags: {
          connect: tagConnections
        },
        defaultTaxes: {
          connect: taxConnections
        },
        allowedJournals: {
          connect: journalConnections
        },
        companyId: data.companyId || (await getCompanyId())
      }
    });
    revalidatePath('/accounting/chart-of-accounts');
    return account;
  } catch (e: any) {
    console.error("CREATE ACCOUNT PRISMA ERROR:", e);
    throw new Error(e.message || "Failed to create account in database");
  }
}
export async function updateAccount(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const tagConnections = data.tags ? data.tags.map((tagId: string) => ({
    id: tagId
  })) : [];
  const taxConnections = data.defaultTaxes ? data.defaultTaxes.map((taxId: string) => ({
    id: taxId
  })) : [];
  const journalConnections = data.allowedJournals ? data.allowedJournals.map((jId: string) => ({
    id: jId
  })) : [];
  await prisma.account.update({
    where: {
      id
    },
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      deprecated: data.deprecated || false,
      tags: {
        set: tagConnections
      },
      defaultTaxes: {
        set: taxConnections
      },
      allowedJournals: {
        set: journalConnections
      }
    }
  });
  revalidatePath('/accounting/chart-of-accounts');
  revalidatePath(`/accounting/chart-of-accounts/${id}`);
}
export async function deleteAccount(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  await prisma.account.delete({
    where: {
      id
    }
  });
  revalidatePath('/accounting/chart-of-accounts');
}
export async function getSuggestedAccountCode(type: string): Promise<string> {
  const {
    generateAccountCode
  } = await import('@/lib/autoCode');
  return await generateAccountCode(type);
}