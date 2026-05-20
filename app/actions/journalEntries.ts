"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
export async function getJournalEntries(opts?: {
  search?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error('Unauthorized');
  const entries = await prisma.journalEntry.findMany({
    where: opts?.search ? {
      OR: [{
        name: {
          contains: opts.search
        }
      }, {
        ref: {
          contains: opts.search
        }
      }]
    } : undefined,
    include: {
      journal: true,
      partner: true,
      items: true
    },
    orderBy: {
      date: 'desc'
    }
  });
  return entries;
}
export async function getJournalEntryById(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (id === 'new') return null;
  const entry = await prisma.journalEntry.findUnique({
    where: {
      id
    },
    include: {
      journal: true,
      partner: true,
      items: {
        include: {
          account: true,
          partner: true
        }
      }
    }
  });
  return entry;
}
export async function getJournals() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return prisma.journal.findMany({
    orderBy: {
      code: 'asc'
    }
  });
}
export async function getAccounts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return prisma.account.findMany({
    orderBy: {
      code: 'asc'
    }
  });
}
export async function getPartners() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return prisma.partner.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}
export async function createJournalEntry(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error('Unauthorized');
  try {
    const entry = await prisma.journalEntry.create({
      data: {
        name: data.name || '/',
        date: new Date(data.date),
        journalId: data.journalId,
        ref: data.ref || null,
        state: 'draft',
        items: {
          create: data.items.map((item: any) => ({
            accountId: item.accountId,
            partnerId: item.partnerId || null,
            name: item.name || '',
            debit: item.debit || 0,
            credit: item.credit || 0
          }))
        }
      }
    });
    
    if (entry.name === '/') {
      const journal = await prisma.journal.findUnique({ where: { id: data.journalId } });
      const prefix = journal?.code || 'MISC';
      const year = new Date(data.date).getFullYear();
      const count = await prisma.journalEntry.count({
        where: {
          journalId: data.journalId,
          date: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1)
          }
        }
      });
      const seqName = `${prefix}/${year}/${String(count).padStart(4, '0')}`;
      await prisma.journalEntry.update({
        where: { id: entry.id },
        data: { name: seqName }
      });
    }
    
    revalidatePath('/[locale]/accounting/journal-entries');
    return {
      success: true,
      id: entry.id
    };
  } catch (e: any) {
    return {
      error: e.message || 'Failed to create journal entry'
    };
  }
}
export async function updateJournalEntry(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error('Unauthorized');
  try {
    const existing = await prisma.journalEntry.findUnique({
      where: {
        id
      }
    });
    if (existing?.state === 'posted') {
      return {
        error: 'لا يمكن تعديل قيد مُرحّل!'
      };
    } // Delete old items and insert new ones
    await prisma.$transaction([prisma.journalItem.deleteMany({
      where: {
        entryId: id
      }
    }), prisma.journalEntry.update({
      where: {
        id
      },
      data: {
        date: new Date(data.date),
        journalId: data.journalId,
        ref: data.ref || null,
        items: {
          create: data.items.map((item: any) => ({
            accountId: item.accountId,
            partnerId: item.partnerId || null,
            name: item.name || '',
            debit: item.debit || 0,
            credit: item.credit || 0
          }))
        }
      }
    })]);
    revalidatePath('/[locale]/accounting/journal-entries');
    revalidatePath(`/[locale]/accounting/journal-entries/${id}`);
    return {
      success: true
    };
  } catch (e: any) {
    return {
      error: e.message || 'Failed to update journal entry'
    };
  }
}
export async function postJournalEntry(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error('Unauthorized');
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: {
        id
      },
      include: {
        items: true
      }
    });
    if (!entry) return {
      error: 'القيد غير موجود'
    };
    if (entry.state === 'posted') return {
      error: 'القيد مُرحّل مسبقاً'
    };
    const totalDebit = entry.items.reduce((sum, item) => sum + Number(item.debit), 0);
    const totalCredit = entry.items.reduce((sum, item) => sum + Number(item.credit), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        error: `القيد غير متوازن! إجمالي المدين (${totalDebit}) لا يساوي الدائن (${totalCredit})`
      };
    }
    if (totalDebit === 0 && totalCredit === 0) {
      return {
        error: 'لا يمكن ترحيل قيد بقيمة صفر'
      };
    }
    await prisma.journalEntry.update({
      where: {
        id
      },
      data: {
        state: 'posted'
      }
    });
    revalidatePath('/[locale]/accounting/journal-entries');
    revalidatePath(`/[locale]/accounting/journal-entries/${id}`);
    return {
      success: true
    };
  } catch (e: any) {
    return {
      error: e.message || 'Failed to post'
    };
  }
}
export async function deleteJournalEntry(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error('Unauthorized');
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: {
        id
      }
    });
    if (entry?.state === 'posted') {
      return {
        error: 'لا يمكن حذف قيد مُرحّل، قم بإلغائه بدلاً من ذلك'
      };
    } // Delete items then entry
    await prisma.journalItem.deleteMany({
      where: {
        entryId: id
      }
    });
    await prisma.journalEntry.delete({
      where: {
        id
      }
    });
    revalidatePath('/[locale]/accounting/journal-entries');
    return {
      success: true
    };
  } catch (e: any) {
    return {
      error: 'لا يمكن حذف هذا القيد لارتباطه بمستندات أخرى'
    };
  }
}