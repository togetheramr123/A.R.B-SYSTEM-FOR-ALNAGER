"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';
export type JournalKanbanData = {
  id: string;
  name: string;
  code: string;
  type: string;
  stats: {
    draftCount: number;
    draftAmount: number;
    unpaidCount: number;
    unpaidAmount: number;
    lateCount: number;
    lateAmount: number;
    balance?: number;
  };
};
export async function getJournalsKanbanData(): Promise<JournalKanbanData[]> {
  var session = await getSession();
  if (!session) return [];
  await ensureAccess('journal', 'read');
  const journals = await prisma.journal.findMany({
    where: {
      companyId: session.companyId
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  const now = new Date();
  const results: JournalKanbanData[] = [];
  for (const journal of journals) {
    let stats = {
      draftCount: 0,
      draftAmount: 0,
      unpaidCount: 0,
      unpaidAmount: 0,
      lateCount: 0,
      lateAmount: 0,
      balance: 0
    };
    if (journal.type === 'sale') {
      const drafts = await prisma.invoice.aggregate({
        where: {
          companyId: session.companyId,
          type: 'out_invoice',
          state: 'draft'
        },
        _count: {
          id: true
        },
        _sum: {
          amountTotal: true
        }
      });
      const unpaid = await prisma.invoice.aggregate({
        where: {
          companyId: session.companyId,
          type: 'out_invoice',
          state: 'posted',
          amountResidual: {
            gt: 0
          }
        },
        _count: {
          id: true
        },
        _sum: {
          amountResidual: true
        }
      });
      const late = await prisma.invoice.aggregate({
        where: {
          companyId: session.companyId,
          type: 'out_invoice',
          state: 'posted',
          amountResidual: {
            gt: 0
          },
          dateDue: {
            lt: now
          }
        },
        _count: {
          id: true
        },
        _sum: {
          amountResidual: true
        }
      });
      stats.draftCount = drafts._count.id;
      stats.draftAmount = Number(drafts._sum.amountTotal || 0);
      stats.unpaidCount = unpaid._count.id;
      stats.unpaidAmount = Number(unpaid._sum.amountResidual || 0);
      stats.lateCount = late._count.id;
      stats.lateAmount = Number(late._sum.amountResidual || 0);
    } else if (journal.type === 'purchase') {
      const drafts = await prisma.invoice.aggregate({
        where: {
          companyId: session.companyId,
          type: 'in_invoice',
          state: 'draft'
        },
        _count: {
          id: true
        },
        _sum: {
          amountTotal: true
        }
      });
      const unpaid = await prisma.invoice.aggregate({
        where: {
          companyId: session.companyId,
          type: 'in_invoice',
          state: 'posted',
          amountResidual: {
            gt: 0
          }
        },
        _count: {
          id: true
        },
        _sum: {
          amountResidual: true
        }
      });
      const late = await prisma.invoice.aggregate({
        where: {
          companyId: session.companyId,
          type: 'in_invoice',
          state: 'posted',
          amountResidual: {
            gt: 0
          },
          dateDue: {
            lt: now
          }
        },
        _count: {
          id: true
        },
        _sum: {
          amountResidual: true
        }
      });
      stats.draftCount = drafts._count.id;
      stats.draftAmount = Number(drafts._sum.amountTotal || 0);
      stats.unpaidCount = unpaid._count.id;
      stats.unpaidAmount = Number(unpaid._sum.amountResidual || 0);
      stats.lateCount = late._count.id;
      stats.lateAmount = Number(late._sum.amountResidual || 0);
    } else if (journal.type === 'bank' || journal.type === 'cash') {
      if (journal.defaultAccountId) {
        const balanceAgg = await prisma.journalItem.aggregate({
          where: {
            accountId: journal.defaultAccountId,
            entry: {
              companyId: session.companyId,
              state: 'posted'
            }
          },
          _sum: {
            debit: true,
            credit: true
          }
        });
        stats.balance = Number(balanceAgg._sum.debit || 0) - Number(balanceAgg._sum.credit || 0);
      }
    }
    results.push({
      id: journal.id,
      name: journal.name,
      code: journal.code,
      type: journal.type,
      stats
    });
  }
  return results;
}