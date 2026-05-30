"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { getCompanyId } from '@/lib/getCompanyId';
import { Decimal } from '@prisma/client/runtime/library';
import { logAuditAction } from "@/app/actions/audit";
export async function getAllCashRegisters() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const registers = await prisma.cashRegister.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: [{
      isMain: 'desc'
    }, {
      createdAt: 'asc'
    }]
  });
  return registers.map((r: any) => ({
    ...r,
    balance: Number(r.balance)
  }));
}
export async function getUserCashRegister() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session?.userId) return null;
  const register = await prisma.cashRegister.findUnique({
    where: {
      userId: session.userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  if (!register) return null;
  return {
    ...register,
    balance: Number(register.balance)
  };
}
export async function getVisibleRegisters() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session?.userId) return [];
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user) return [];
  if (user.role === 'ADMIN') return getAllCashRegisters();
  const ids: string[] = [];
  const ownRegister = await prisma.cashRegister.findUnique({
    where: {
      userId: session.userId
    }
  });
  if (ownRegister) ids.push(ownRegister.id);
  if (user.visibleRegisterIds) {
    ids.push(...user.visibleRegisterIds.split(',').filter(Boolean));
  }
  const registers = await prisma.cashRegister.findMany({
    where: {
      id: {
        in: ids
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  return registers.map((r: any) => ({
    ...r,
    balance: Number(r.balance)
  }));
}
export async function getMainRegister() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const register = await prisma.cashRegister.findFirst({
    where: {
      isMain: true
    }
  });
  if (!register) return null;
  return {
    ...register,
    balance: Number(register.balance)
  };
}
export async function createCashRegister(data: {
  name: string;
  code?: string;
  userId?: string;
  isMain?: boolean;
  accountId?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  const companyId = await getCompanyId();
  let code = data.code;
  if (!code) {
    const count = await prisma.cashRegister.count();
    code = String(count + 1).padStart(4, '0');
  }
  const register = await prisma.cashRegister.create({
    data: {
      name: data.name,
      code,
      userId: data.userId || null,
      isMain: data.isMain || false,
      accountId: data.accountId || null,
      companyId
    }
  });
  if (data.userId) {
    await prisma.user.update({
      where: {
        id: data.userId
      },
      data: {
        cashRegisterEnabled: true,
        canReceive: true,
        canDisburse: true
      }
    });
  }

  await logAuditAction({
    action: "create",
    model: "cashRegister",
    recordId: register.id,
    recordName: register.name,
    newValues: { name: data.name, code, userId: data.userId, isMain: data.isMain },
  });

  try {
    revalidatePath('/accounting/cash-registers');
  } catch (error) { console.error("Silent error caught in app/actions/cash-register.ts:", error); }
  return register;
}
export async function updateUserCashPermissions(userId: string, permissions: {
  cashRegisterEnabled?: boolean;
  canReceive?: boolean;
  canDisburse?: boolean;
  autoSettle?: boolean;
  visibleRegisterIds?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error('غير مصرح');
  await prisma.user.update({
    where: {
      id: userId
    },
    data: permissions
  });

  await logAuditAction({
    action: "update",
    model: "cashRegister",
    recordId: userId,
    recordName: "",
    newValues: permissions,
  });

  try {
    revalidatePath('/settings');
  } catch (error) { console.error("Silent error caught in app/actions/cash-register.ts:", error); }
}
export async function getCashRegister(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const register = await prisma.cashRegister.findUnique({
    where: {
      id
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  if (!register) return null;
  return {
    ...register,
    balance: Number(register.balance)
  };
}
export async function createCashTransaction(data: {
  type: 'receipt' | 'disbursement';
  amount: number;
  description: string;
  ref?: string;
  partnerId?: string;
  registerId?: string;
  date?: string | Date;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session?.userId) throw new Error('غير مصرح');
  const companyId = await getCompanyId();
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user?.cashRegisterEnabled) throw new Error('الخزينة غير مُفعَّلة لهذا المستخدم');
  if (data.type === 'receipt' && !user.canReceive) throw new Error('ليس لديك صلاحية سند قبض');
  if (data.type === 'disbursement' && !user.canDisburse) throw new Error('ليس لديك صلاحية سند صرف');
  let registerId = data.registerId;
  if (!registerId) {
    const ownRegister = await prisma.cashRegister.findUnique({
      where: {
        userId: session.userId
      }
    });
    if (!ownRegister) throw new Error('لا توجد خزينة مرتبطة بهذا المستخدم');
    registerId = ownRegister.id;
  }
  return await prisma.$transaction(async tx => {
    const prefix = data.type === 'receipt' ? 'RCV' : 'DSB';
    const now = data.date ? new Date(data.date) : new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await tx.cashTransaction.count({
      where: {
        type: data.type,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      }
    });
    const name = `${prefix}/${yearMonth}/${String(count + 1).padStart(4, '0')}`;
    const transaction = await tx.cashTransaction.create({
      data: {
        name,
        type: data.type,
        amount: data.amount,
        date: now,
        description: data.description,
        ref: data.ref || null,
        registerId,
        partnerId: data.partnerId || null,
        userId: session.userId,
        companyId
      }
    });
    const balanceChange = data.type === 'receipt' ? data.amount : -data.amount;
    await tx.cashRegister.update({
      where: {
        id: registerId
      },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    });
    const register = await tx.cashRegister.findUnique({
      where: {
        id: registerId
      }
    });
    if (register?.accountId) {
      const cashAccount = await tx.account.findUnique({
        where: {
          id: register.accountId
        }
      });
      if (cashAccount) {
        let counterAccountId: string | null = null;
        if (data.type === 'receipt') {
          const receivableAcc = await tx.account.findFirst({
            where: {
              type: 'receivable'
            }
          });
          counterAccountId = receivableAcc?.id || null;
        } else {
          const payableAcc = await tx.account.findFirst({
            where: {
              type: 'payable'
            }
          });
          counterAccountId = payableAcc?.id || null;
        }
        if (counterAccountId) {
          const journal = await tx.journal.findFirst({
            where: {
              type: 'cash'
            }
          });
          if (journal) {
            const isReceipt = data.type === 'receipt';
            const entry = await tx.journalEntry.create({
              data: {
                name: `CASH/${name}`,
                date: now,
                journalId: journal.id,
                ref: data.ref || data.description,
                state: 'posted',
                companyId,
                items: {
                  create: [{
                    accountId: isReceipt ? cashAccount.id : counterAccountId,
                    name: data.description,
                    debit: data.amount,
                    credit: 0,
                    companyId
                  }, {
                    accountId: isReceipt ? counterAccountId : cashAccount.id,
                    name: data.description,
                    debit: 0,
                    credit: data.amount,
                    companyId
                  }]
                }
              }
            });
            await tx.cashTransaction.update({
              where: {
                id: transaction.id
              },
              data: {
                journalEntryId: entry.id
              }
            });
          }
        }
      }
    }

    await logAuditAction({
      action: "create",
      model: "cashRegister",
      recordId: transaction.id,
      recordName: transaction.name,
      newValues: { type: data.type, amount: data.amount, description: data.description, registerId },
    });

    return transaction;
  });
}
export async function getCashTransactions(registerId: string, from?: string, to?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const where: any = {
    registerId
  };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }
  const transactions = await prisma.cashTransaction.findMany({
    where,
    orderBy: {
      date: 'asc'
    },
    include: {
      user: {
        select: {
          name: true
        }
      }
    }
  });
  return transactions.map((t: any) => ({
    ...t,
    amount: Number(t.amount)
  }));
}
export async function getCashRegisterStatement(registerId: string, from: string, to: string, includeOpeningBalance: boolean = true) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const register = await prisma.cashRegister.findUnique({
    where: {
      id: registerId
    },
    include: {
      user: {
        select: {
          name: true
        }
      }
    }
  });
  if (!register) throw new Error('الخزينة غير موجودة');
  let openingBalance = new Decimal(0);
  if (includeOpeningBalance) {
    const beforeTransactions = await prisma.cashTransaction.findMany({
      where: {
        registerId,
        date: {
          lt: new Date(from)
        }
      }
    });
    for (const t of beforeTransactions) {
      if (t.type === 'receipt') {
        openingBalance = openingBalance.plus(t.amount);
      } else {
        openingBalance = openingBalance.minus(t.amount);
      }
    }
  }
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  const transactions = await prisma.cashTransaction.findMany({
    where: {
      registerId,
      date: {
        gte: new Date(from),
        lte: toDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
  let runningBalance = openingBalance;
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);
  const lines = transactions.map((t: any) => {
    const debit = t.type === 'receipt' ? new Decimal(t.amount) : new Decimal(0);
    const credit = t.type === 'disbursement' ? new Decimal(t.amount) : new Decimal(0);
    totalDebit = totalDebit.plus(debit);
    totalCredit = totalCredit.plus(credit);
    runningBalance = runningBalance.plus(debit).minus(credit);
    return {
      id: t.id,
      date: t.date,
      ref: t.ref || t.name,
      description: t.description || '',
      debit: debit.toNumber(),
      credit: credit.toNumber(),
      balance: runningBalance.toNumber(),
      balanceType: runningBalance.gte(0) ? 'مدين' : 'دائن'
    };
  });
  return {
    register: {
      id: register.id,
      name: register.name,
      code: register.code,
      userName: register.user?.name || 'خزينة الحسابات'
    },
    from,
    to,
    openingBalance: openingBalance.toNumber(),
    openingBalanceType: openingBalance.gte(0) ? 'مدين' : 'دائن',
    lines,
    totalDebit: totalDebit.toNumber(),
    totalCredit: totalCredit.toNumber(),
    closingBalance: runningBalance.toNumber(),
    closingBalanceType: runningBalance.gte(0) ? 'مدين' : 'دائن'
  };
}
export async function performSettlement(registerId: string, performedById?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const companyId = await getCompanyId();
  return await prisma.$transaction(async tx => {
    const register = await tx.cashRegister.findUnique({
      where: {
        id: registerId
      },
      include: {
        user: true
      }
    });
    if (!register) throw new Error('الخزينة غير موجودة');
    if (register.isMain) throw new Error('لا يمكن ترحيل الخزينة الرئيسية');
    const unsettled = await tx.cashTransaction.findMany({
      where: {
        registerId,
        isSettled: false
      }
    });
    if (unsettled.length === 0) return {
      message: 'لا توجد معاملات للترحيل'
    };
    let totalReceipts = new Decimal(0);
    let totalDisbursements = new Decimal(0);
    for (const t of unsettled) {
      if (t.type === 'receipt') totalReceipts = totalReceipts.plus(t.amount);else totalDisbursements = totalDisbursements.plus(t.amount);
    }
    const netAmount = totalReceipts.minus(totalDisbursements);
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const settCount = await tx.cashSettlement.count({
      where: {
        registerId,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      }
    });
    const name = `SET/${dateStr}/${String(settCount + 1).padStart(4, '0')}`;
    const openingBalance = Number(register.balance);
    const settlement = await tx.cashSettlement.create({
      data: {
        name,
        date: now,
        registerId,
        userId: register.userId || performedById || '',
        performedById: performedById || null,
        totalReceipts,
        totalDisbursements,
        netAmount,
        openingBalance: register.balance,
        closingBalance: 0
      }
    });
    await tx.cashTransaction.updateMany({
      where: {
        id: {
          in: unsettled.map(t => t.id)
        }
      },
      data: {
        isSettled: true,
        settlementId: settlement.id
      }
    });
    const mainRegister = await tx.cashRegister.findFirst({
      where: {
        isMain: true
      }
    });
    if (mainRegister && !netAmount.isZero()) {
      await tx.cashRegister.update({
        where: {
          id: registerId
        },
        data: {
          balance: 0
        }
      });
      await tx.cashRegister.update({
        where: {
          id: mainRegister.id
        },
        data: {
          balance: {
            increment: netAmount
          }
        }
      });
      if (register.accountId && mainRegister.accountId) {
        const journal = await tx.journal.findFirst({
          where: {
            type: 'cash'
          }
        });
        if (journal) {
          await tx.journalEntry.create({
            data: {
              name: `SETTLE/${name}`,
              date: now,
              journalId: journal.id,
              ref: `ترحيل خزينة ${register.name}`,
              state: 'posted',
              companyId,
              items: {
                create: netAmount.isPositive() ? [{
                  accountId: mainRegister.accountId!,
                  name: `ترحيل من ${register.name}`,
                  debit: netAmount,
                  credit: 0,
                  companyId
                }, {
                  accountId: register.accountId!,
                  name: `ترحيل إلى خزينة الحسابات`,
                  debit: 0,
                  credit: netAmount,
                  companyId
                }] : [{
                  accountId: register.accountId!,
                  name: `ترحيل من خزينة الحسابات`,
                  debit: netAmount.abs(),
                  credit: 0,
                  companyId
                }, {
                  accountId: mainRegister.accountId!,
                  name: `ترحيل إلى ${register.name}`,
                  debit: 0,
                  credit: netAmount.abs(),
                  companyId
                }]
              }
            }
          });
        }
      }
    }

    await logAuditAction({
      action: "create",
      model: "cashRegister",
      recordId: settlement.id,
      recordName: settlement.name,
      newValues: { registerId, totalReceipts: totalReceipts.toNumber(), totalDisbursements: totalDisbursements.toNumber(), netAmount: netAmount.toNumber() },
    });

    return {
      success: true,
      settlement
    };
  });
}
export async function performDailySettlementAll() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const users = await prisma.user.findMany({
    where: {
      cashRegisterEnabled: true,
      autoSettle: true
    },
    include: {
      cashRegister: true
    }
  });
  const results = [];
  for (const user of users) {
    if (!user.cashRegister) continue;
    try {
      const result = await performSettlement(user.cashRegister.id);
      results.push({
        userId: user.id,
        userName: user.name,
        ...result
      });
    } catch (e: any) {
      results.push({
        userId: user.id,
        userName: user.name,
        error: e.message
      });
    }
  }
  return results;
}
export async function getSettlements(registerId?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const where = registerId ? {
    registerId
  } : {};
  const settlements = await prisma.cashSettlement.findMany({
    where,
    include: {
      register: {
        select: {
          name: true,
          code: true
        }
      },
      user: {
        select: {
          name: true
        }
      },
      performedBy: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          transactions: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: 100
  });
  return settlements.map((s: any) => ({
    ...s,
    totalReceipts: Number(s.totalReceipts),
    totalDisbursements: Number(s.totalDisbursements),
    netAmount: Number(s.netAmount),
    openingBalance: Number(s.openingBalance),
    closingBalance: Number(s.closingBalance)
  }));
}
export async function getUsersWithCashPermissions() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cashRegisterEnabled: true,
      canReceive: true,
      canDisburse: true,
      autoSettle: true,
      visibleRegisterIds: true,
      cashRegister: {
        select: {
          id: true,
          name: true,
          code: true,
          balance: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
  return users.map((u: any) => ({
    ...u,
    cashRegister: u.cashRegister ? {
      ...u.cashRegister,
      balance: Number(u.cashRegister.balance)
    } : null
  }));
}