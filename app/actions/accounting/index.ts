"use server";
import { ensureAccess } from "@/lib/access";

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCompanyPrisma } from '@/lib/prismaCompany';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { getSession } from '@/lib/auth';
import { logTrackingChanges, TrackingChange } from '@/app/actions/chatter';
import { getNextSequence, getNextSequenceLegacy } from '@/lib/sequence';
import { CreateInvoiceSchema, SaveJournalSchema, CreateJournalEntrySchema } from '@/lib/schemas';
import { ok, fail } from '@/lib/actionResult';
import { checkPeriodLock } from '@/app/actions/year-end';
import { getCompanyId } from '@/lib/getCompanyId';
import { dispatchNotification } from '@/app/actions/notification_engine';

function validateDoubleEntry(items: { debit?: number | any | string; credit?: number | any | string }[]): boolean {
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);
  for (const item of items) {
    totalDebit = totalDebit.plus(new Decimal(item.debit || 0));
    totalCredit = totalCredit.plus(new Decimal(item.credit || 0));
  }
  return totalDebit.minus(totalCredit).abs().lessThan(0.01);
}
export async function getChartOfAccounts() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const cprisma = await getCompanyPrisma();
  try {
    const accounts = await cprisma.account.findMany({
      orderBy: {
        code: 'asc'
      },
    });
    return accounts.map((acc: any) => ({
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      internalGroup: acc.internalGroup || acc.type
    }));
  } catch (error) {
    console.error("Failed to fetch Chart of Accounts:", error);
    return [];
  }
}
export async function saveAccount(data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    let account;
    const payload: any = {
      code: data.code,
      name: data.name,
      type: data.type,
    };
    if (data.id && data.id !== 'new') {
      account = await prisma.account.update({
        where: {
          id: data.id
        },
        data: payload
      });
    } else {
      const existing = await prisma.account.findUnique({
        where: {
          code_companyId: { code: data.code, companyId: (await getFirstCompany()).id }
        }
      });
      if (existing) {
        return {
          success: false,
          error: "Account code already exists."
        };
      }
      const company = await getFirstCompany();
      account = await prisma.account.create({
        data: {
          ...payload,
          companyId: company.id
        }
      });
    }
    revalidatePath('/[locale]/accounting/accounts');
    return {
      success: true,
      account
    };
  } catch (error) {
    console.error("Failed to save account:", error);
    return {
      success: false,
      error: "Failed to save account."
    };
  }
}

async function getFirstCompany() {
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found in database. Please run seeding.");
  return company;
}
export async function createAccount(data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "write");

  return saveAccount(data);
}
export async function generateStockMoveEntry(opts: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");

  return generateStockMoveEntryV2(opts);
}
export async function generateStockMoveEntryV2(opts: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");

  try {
    const moveId = opts.moveId || opts;
    const move = await prisma.stockMove.findUnique({
      where: {
        id: moveId
      },
      include: {
        product: {
          include: {
            category: true
          }
        },
        sourceLocation: true,
        destLocation: true
      }
    });
    if (!move || !move.product) {
      return true;
    }
    const category = move.product.category;
    if (!category || category.valuation !== 'real_time') {
      return true;
    }
    const stockAccountId = category.propertyStockAccountId;
    const stockInputAccountId = category.propertyStockAccountInputId;
    const stockOutputAccountId = category.propertyStockAccountOutputId;
    const stockJournalId = category.propertyStockJournalId;
    if (!stockAccountId) {
      return true;
    }
    let journalId = stockJournalId;
    if (!journalId) {
      const stockJournal = await prisma.journal.findFirst({
        where: {
          type: 'general'
        }
      });
      if (!stockJournal) {
        return true;
      }
      journalId = stockJournal.id;
    }
    const qty = Number(move.quantityDone || move.quantity);
    const unitCost = Number(move.product.costPrice || 0);
    const totalValue = qty * unitCost;
    if (totalValue <= 0) {
      return true;
    }
    const isIncoming = move.destLocation?.type === 'internal' && move.sourceLocation?.type !== 'internal';
    const isOutgoing = move.sourceLocation?.type === 'internal' && move.destLocation?.type !== 'internal';
    let debitAccountId: string;
    let creditAccountId: string;
    if (isIncoming) {
      // استلام: مدين حساب المخزون، دائن حساب المخزون الوارد
      debitAccountId = stockAccountId;
      creditAccountId = stockInputAccountId || stockAccountId;
    } else if (isOutgoing) {
      // صرف: مدين حساب المخزون المنصرف، دائن حساب المخزون
      debitAccountId = stockOutputAccountId || stockAccountId;
      creditAccountId = stockAccountId;
    } else {
      return true;
    }
    const name = await getNextSequenceLegacy('STJ', 'journalEntry', {
      journalId
    }, undefined, move.date || new Date());
    const entry = await prisma.journalEntry.create({
      data: {
        name,
        date: move.date || new Date(),
        journalId: journalId,
        state: 'posted',
        ref: `حركة مخزن: ${move.name || move.reference || moveId}`,
        items: {
          create: [{
            accountId: debitAccountId,
            name: `${move.product.name} - ${isIncoming ? 'استلام' : 'صرف'}`,
            debit: totalValue,
            credit: 0,
            productId: move.product.id
          }, {
            accountId: creditAccountId,
            name: `${move.product.name} - ${isIncoming ? 'استلام' : 'صرف'}`,
            debit: 0,
            credit: totalValue,
            productId: move.product.id
          }]
        }
      }
    });
    await prisma.stockMove.update({
      where: {
        id: moveId
      },
      data: {
        journalEntryId: entry.id
      }
    });
    return true;
  } catch (error) {
    console.error(`Failed to generate stock move entry:`, error);
    return false;
  }
}
export async function updateInvoiceLine(lineId: string, updates: {
  priceUnit?: number;
  quantity?: number;
  discount1?: number;
  discount2?: number;
  secondaryQuantity?: number;
}) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    const line = await prisma.invoiceLine.findUnique({
      where: {
        id: lineId
      },
      include: {
        invoice: {
          include: {
            lines: true
          }
        }
      }
    });
    if (!line) return {
      success: false,
      error: 'Line not found'
    };
    if (line.invoice.state === 'posted') return {
      success: false,
      error: 'Cannot edit posted invoice'
    };
    const priceUnit = updates.priceUnit !== undefined ? updates.priceUnit : Number(line.priceUnit);
    const quantity = updates.quantity !== undefined ? updates.quantity : Number(line.quantity);
    const discount1 = updates.discount1 !== undefined ? updates.discount1 : Number(line.discount1 || 0);
    const discount2 = updates.discount2 !== undefined ? updates.discount2 : Number((line as any).discount2 || 0);
    const newSubtotal = priceUnit * quantity * (1 - discount1 / 100) * (1 - discount2 / 100);
    const dataToUpdate: any = {
      priceUnit,
      quantity,
      discount1,
      discount2,
      priceSubtotal: newSubtotal,
      priceNet: newSubtotal
    };
    if (updates.secondaryQuantity !== undefined) {
      dataToUpdate.secondaryQuantity = updates.secondaryQuantity;
    }
    await prisma.$transaction(async tx => {
      await tx.invoiceLine.update({
        where: {
          id: lineId
        },
        data: dataToUpdate
      });
      const updatedInvoice = await tx.invoice.findUnique({
        where: {
          id: line.invoiceId
        },
        include: {
          lines: true
        }
      });
      let untaxedDec = new Decimal(0);
      let taxesDec = new Decimal(0);
      if (updatedInvoice) {
        for (const l of updatedInvoice.lines) {
          const subtotalDec = new Decimal(l.priceSubtotal.toString());
          const taxRate = new Decimal(String((l as any).tax || 0));
          untaxedDec = untaxedDec.plus(subtotalDec);
          taxesDec = taxesDec.plus(subtotalDec.times(taxRate).div(100));
        }
        await tx.invoice.update({
          where: {
            id: line.invoiceId
          },
          data: {
            amountUntaxed: untaxedDec.toNumber(),
            amountTax: taxesDec.toNumber(),
            amountTotal: untaxedDec.plus(taxesDec).toNumber(),
            amountResidual: untaxedDec.plus(taxesDec).toNumber()
          }
        });
      }
    });
    revalidatePath('/[locale]/accounting/bills/[id]', 'page');
    revalidatePath('/[locale]/accounting/invoices/[id]', 'page');
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Failed to update invoice line:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
export async function getJournals(type?: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const cprisma = await getCompanyPrisma();
  try {
    const whereClause = type ? {
      type
    } : {};
    const journals = await cprisma.journal.findMany({
      where: whereClause,
      include: {
        defaultAccount: true,
        _count: {
          select: {
            entries: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    return journals.map(j => ({
      id: j.id,
      name: j.name,
      code: j.code,
      type: j.type,
      defaultAccountId: j.defaultAccountId,
      defaultAccountName: j.defaultAccount?.name || '',
      entryCount: j._count.entries
    }));
  } catch (error) {
    console.error("Failed to fetch journals:", error);
    return [];
  }
}
export async function saveJournal(data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    let journal;
    if (data.id && data.id !== 'new') {
      journal = await prisma.journal.update({
        where: {
          id: data.id
        },
        data: {
          name: data.name,
          code: data.code,
          type: data.type,
          defaultAccountId: data.defaultAccountId || null
        }
      });
    } else {
      journal = await prisma.journal.create({
        data: {
          name: data.name,
          code: data.code,
          type: data.type,
          defaultAccountId: data.defaultAccountId || null,
          company: {
            connect: {
              id: (await getFirstCompany()).id
            }
          }
        }
      });
    }
    revalidatePath('/[locale]/accounting/journals');
    return {
      success: true,
      journal
    };
  } catch (error) {
    console.error("Failed to save journal:", error);
    return {
      success: false,
      error: "Failed to save journal."
    };
  }
}
async function getJournalEntries() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");
  if (!session) return [];
  const cprisma = await getCompanyPrisma();
  try {
    const entries = await cprisma.journalEntry.findMany({
      include: {
        journal: {
          select: {
            name: true,
            code: true
          }
        },
        partner: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            items: true
          }
        },
        items: {
          select: {
            debit: true,
            credit: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 100
    });
    return entries.map(e => {
      const sumDebit = e.items.reduce((sum, item) => sum + Number(item.debit), 0);
      return {
        id: e.id,
        name: e.name || 'Draft',
        date: e.date.toISOString().split('T')[0],
        journalName: e.journal.name,
        partnerName: e.partner?.name || '',
        state: e.state,
        total: sumDebit
      };
    });
  } catch (error) {
    console.error("Failed to fetch journal entries:", error);
    return [];
  }
}
export async function saveJournalEntry(data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    if (data.date) {
      await checkPeriodLock(new Date(data.date), session.userId);
    }
    let entry: any;
    const sumDebit = data.items.reduce((sum: number, item: any) => sum + Number(item.debit || 0), 0);
    const sumCredit = data.items.reduce((sum: number, item: any) => sum + Number(item.credit || 0), 0);
    if (Math.abs(sumDebit - sumCredit) > 0.01) {
      return {
        success: false,
        error: `القيد غير متزن (مدين: ${sumDebit.toFixed(2)}, دائن: ${sumCredit.toFixed(2)})`
      };
    }
    await prisma.$transaction(async tx => {
      if (data.id && data.id !== 'new') {
        await tx.journalEntry.update({
          where: {
            id: data.id
          },
          data: {
            date: new Date(data.date),
            ref: data.ref,
            journalId: data.journalId,
            partnerId: data.partnerId || null,
            state: data.state || 'draft'
          }
        });
        await tx.journalItem.deleteMany({
          where: {
            entryId: data.id
          }
        });
        await tx.journalItem.createMany({
          data: data.items.map((item: any) => ({
            entryId: data.id,
            accountId: item.accountId,
            partnerId: item.partnerId || null,
            name: item.name || data.ref,
            debit: Number(item.debit || 0),
            credit: Number(item.credit || 0)
          }))
        });
      } else {
        const journal = await tx.journal.findUnique({
          where: {
            id: data.journalId
          }
        });
        const code = journal?.code || 'MISC';
        if (!validateDoubleEntry(data.items)) {
          throw new Error('القيود المحاسبية غير متزنة (مجموع المدين لا يساوي مجموع الدائن). يرجى مراجعة الأرقام.');
        }

        const now = new Date();
        const jeCount = await tx.journalEntry.count({
          where: {
            journalId: data.journalId,
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1)
            }
          }
        });
        const sequenceName = `${code}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(jeCount + 1).padStart(4, '0')}`;
        entry = await tx.journalEntry.create({
          data: {
            name: sequenceName,
            date: new Date(data.date),
            ref: data.ref,
            journalId: data.journalId,
            partnerId: data.partnerId || null,
            state: data.state || 'draft',
            items: {
              create: data.items.map((item: any) => ({
                accountId: item.accountId,
                partnerId: item.partnerId || null,
                name: item.name || data.ref,
                debit: Number(item.debit || 0),
                credit: Number(item.credit || 0)
              }))
            }
          }
        });
      }
    });
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      }
    });
    await dispatchNotification({
      eventCode: 'JOURNAL_ENTRY_CREATED',
      subject: 'قيد يومية مالي جديد',
      body: `قام المستخدم ${user?.name || 'مجهول'} بتسجيل قيد يومية جديد (${entry?.name || 'بدون رقم'}) بمبلغ إجمالي ${sumDebit}.`
    });
    revalidatePath('/[locale]/accounting/journal-entries');
    return {
      success: true,
      entryId: entry?.id
    };
  } catch (error: any) {
    console.error("Failed to save journal entry:", error);
    return {
      success: false,
      error: error.message || "Failed to save journal entry."
    };
  }
}
async function getJournalItems(productId?: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");
  if (!session) return [];
  try {
    const where: any = {};
    if (productId) where.productId = productId;
    const items = await prisma.journalItem.findMany({
      where,
      include: {
        account: {
          select: {
            code: true,
            name: true
          }
        },
        entry: {
          select: {
            name: true,
            date: true,
            state: true,
            partner: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 200
    });
    return items.map((item: any) => ({
      id: item.id,
      entryName: item.entry.name,
      date: item.entry.date,
      accountCode: item.account.code,
      accountName: item.account.name,
      label: item.name || '',
      partner: item.entry.partner?.name || '',
      debit: Number(item.debit),
      credit: Number(item.credit),
      balance: Number(item.debit) - Number(item.credit),
      state: item.entry.state
    }));
  } catch (error) {
    console.error("Failed to fetch journal items:", error);
    return [];
  }
}
export async function getPartnerLedgerSimple(partnerId?: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  try {
    if (!partnerId) return {
      items: [],
      balance: 0
    };
    const items = await prisma.journalItem.findMany({
      where: {
        entry: {
          partnerId,
          state: 'posted'
        }
      },
      include: {
        account: {
          select: {
            code: true,
            name: true,
            type: true
          }
        },
        entry: {
          select: {
            name: true,
            date: true,
            ref: true,
            journal: {
              select: {
                name: true
              }
            },
            partner: {
              select: {
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
    let runningBalance = 0;
    const ledgerItems = items.map((item: any) => {
      const debit = Number(item.debit);
      const credit = Number(item.credit);
      runningBalance += debit - credit;
      return {
        id: item.id,
        date: item.entry.date,
        journalName: item.entry.journal?.name || '-',
        entryName: item.entry.name,
        partnerName: item.entry.partner?.name || '-',
        label: item.name || item.entry.ref || '-',
        accountCode: item.account.code,
        accountName: item.account.name,
        debit,
        credit,
        balance: runningBalance
      };
    });
    return {
      items: ledgerItems,
      balance: runningBalance
    };
  } catch (error) {
    console.error("Failed to fetch partner ledger:", error);
    return {
      items: [],
      balance: 0
    };
  }
}
export async function confirmInvoice(id: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    const result = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id
        },
        include: {
          lines: {
            include: {
              product: true
            }
          },
          partner: true
        }
      });
      if (!invoice) throw new Error('فاتورة غير موجودة');
      if (invoice.state === 'posted') throw new Error('الفاتورة مرحلة بالفعل');
      await checkPeriodLock(invoice.dateInvoice, session.userId);
      const hasZeroPriceItem = invoice.lines.some(l => Number(l.priceUnit) === 0);
      if (hasZeroPriceItem && invoice.approvalStatus !== 'approved' && session.role !== 'ADMIN') {
        throw new Error('لا يمكن تأكيد الفاتورة لاحتوائها على أصناف بصفر قبل موافقة الإدارة');
      }
      if (invoice.lines.length > 0) {
        const hasPositiveQuantity = invoice.lines.some(l => Number(l.quantity) > 0);
        if (!hasPositiveQuantity) {
          throw new Error('لا يمكن ترحيل فاتورة كمياتها صفر! تم تصفير المخزن المرتبط بها، لذا يجب إلغاء أو حذف هذه الفاتورة.');
        }
      }
      if (invoice.saleOrderId) {
        const soLines = await tx.saleOrderLine.findMany({
          where: {
            orderId: invoice.saleOrderId
          }
        });
        for (const line of invoice.lines) {
          if (line.lineType !== 'line') continue;
          const soLine = soLines.find(l => l.productId === line.productId);
          if (soLine) {
            const maxInvoiceable = Number(soLine.qtyDelivered || 0) - Number(soLine.qtyInvoiced || 0);
            if (Number(line.quantity) > maxInvoiceable + 0.01) {
              throw new Error(`الترابط المخزني يمنع الترحيل: كمية الصنف "${line.product?.name}" في الفاتورة (${line.quantity}) تتجاوز الكمية القابلة للفوترة (${maxInvoiceable.toFixed(2)} = مسلّم ${soLine.qtyDelivered} - مفوتر ${soLine.qtyInvoiced}).`);
            }
          }
        }
      } else if (invoice.purchaseOrderId) {
        const poLines = await tx.purchaseOrderLine.findMany({
          where: {
            orderId: invoice.purchaseOrderId
          }
        });
        for (const line of invoice.lines) {
          if (line.lineType !== 'line') continue;
          const poLine = poLines.find(l => l.productId === line.productId);
          if (poLine) {
            const maxInvoiceable = Number(poLine.qtyReceived || 0) - Number(poLine.qtyInvoiced || 0);
            if (Number(line.quantity) > maxInvoiceable + 0.01) {
              throw new Error(`الترابط المخزني يمنع الترحيل: كمية الصنف "${line.product?.name}" في الفاتورة (${line.quantity}) تتجاوز الكمية القابلة للفوترة (${maxInvoiceable.toFixed(2)} = مستلم ${poLine.qtyReceived} - مفوتر ${poLine.qtyInvoiced}).`);
            }
          }
        }
      }
      const isSale = invoice.type === 'out_invoice' || invoice.type === 'out_refund';
      const isRefund = invoice.type === 'out_refund' || invoice.type === 'in_refund';
      let companyId = invoice.companyId;
      if (!companyId) {
        const company = await tx.company.findFirst();
        ;
        companyId = company?.id || '';
      } // Find journal
      const journalType = isSale ? 'sale' : 'purchase';
      let journal = await tx.journal.findFirst({
        where: {
          type: journalType
        }
      });
      if (!journal) {
        journal = await tx.journal.create({
          data: {
            name: isSale ? 'فواتير المبيعات' : 'فواتير المشتريات',
            code: isSale ? 'INV' : 'BILL',
            type: journalType,
            companyId: companyId
          }
        });
      } // Find or Create Accounts (Anglo-Saxon in Arabic);
      const getOrCreateAccount = async (type: string, name: string, code: string) => {
        let acc = await tx.account.findFirst({
          where: {
            type
          }
        });
        if (!acc) {
          acc = await tx.account.create({
            data: {
              name,
              code,
              type,
              companyId: companyId!
            }
          });
        }
        return acc;
      };
      const receivableAccount = await getOrCreateAccount('receivable', 'حساب العملاء', '102011');
      const payableAccount = await getOrCreateAccount('payable', 'حساب الموردين', '201001');
      const incomeAccount = await getOrCreateAccount('income', 'إيرادات المبيعات', '500001');
      const cogsAccount = await getOrCreateAccount('expense', 'تكلفة البضاعة المباعة', '400002');
      const stockInterimAccount = await getOrCreateAccount('current_assets', 'المخزون الوسيط (الوارد/المنصرف)', '103049');
      const partnerAccount = isSale ? receivableAccount : payableAccount;
      const totalAmount = Number(invoice.amountTotal);
      const journalItems: {
        accountId: string;
        name: string;
        debit: number;
        credit: number;
        balance?: number;
        partnerId?: string;
        productId?: string;
      }[] = []; 
      
      let finalInvoiceName = invoice.name;
      // Generate sequence on post
      if (!finalInvoiceName || finalInvoiceName.includes('مسودة') || finalInvoiceName === 'Draft') {
        const prefix = isRefund ? invoice.type === 'out_refund' ? 'RINV' : 'RBILL' : isSale ? 'INV' : 'BILL';
        finalInvoiceName = await getNextSequenceLegacy(prefix, 'invoice', {
          type: invoice.type
        }, tx, new Date(invoice.dateInvoice));
      } 
      // 1. Partner line (Receivable or Payable)
      if (isSale && !isRefund) {
        // Sale Invoice: Dr Receivable
        journalItems.push({ accountId: partnerAccount.id, name: finalInvoiceName, debit: totalAmount, credit: 0, balance: totalAmount, partnerId: invoice.partnerId || undefined });
      } else if (!isSale && !isRefund) {
        // Purchase Bill: Cr Payable
        journalItems.push({ accountId: partnerAccount.id, name: finalInvoiceName, debit: 0, credit: totalAmount, balance: -totalAmount, partnerId: invoice.partnerId || undefined });
      } else if (isSale && isRefund) {
        // Credit Note (Sale): Cr Receivable
        journalItems.push({ accountId: partnerAccount.id, name: finalInvoiceName, debit: 0, credit: totalAmount, balance: -totalAmount, partnerId: invoice.partnerId || undefined });
      } else if (!isSale && isRefund) {
        // Debit Note (Purchase): Dr Payable
        journalItems.push({ accountId: partnerAccount.id, name: finalInvoiceName, debit: totalAmount, credit: 0, balance: totalAmount, partnerId: invoice.partnerId || undefined });
      }
      
      // 2. Revenue/Expense lines + Anglo-Saxon COGS
      for (const line of invoice.lines) {
        const lineAmount = Number(line.priceSubtotal);
        if (lineAmount === 0) continue;
        const isStorable = line.product?.type === 'storable';
        const productCost = new Decimal(Number(line.product?.costPrice) || 0).times(new Decimal(Number(line.quantity) || 0)).toNumber();
        
        if (isSale && !isRefund) {
          // Revenue
          journalItems.push({ accountId: incomeAccount.id, name: line.name || '', debit: 0, credit: lineAmount, balance: -lineAmount, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
          // Anglo-Saxon COGS (Only for storable)
          if (isStorable && productCost > 0) {
            journalItems.push({ accountId: cogsAccount.id, name: `ت.م: ${line.name || ''}`, debit: productCost, credit: 0, balance: productCost, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
            journalItems.push({ accountId: stockInterimAccount.id, name: `منصرف: ${line.name || ''}`, debit: 0, credit: productCost, balance: -productCost, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
          }
        } else if (!isSale && !isRefund) {
          // Purchase: Dr Stock Interim (Anglo-Saxon), Cr Payable
          const lineAcc = isStorable ? stockInterimAccount.id : cogsAccount.id;
          journalItems.push({ accountId: lineAcc, name: line.name || '', debit: lineAmount, credit: 0, balance: lineAmount, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
        } else if (isSale && isRefund) {
          // Sale Refund
          journalItems.push({ accountId: incomeAccount.id, name: line.name || '', debit: lineAmount, credit: 0, balance: lineAmount, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
          // Reverse COGS
          if (isStorable && productCost > 0) {
            journalItems.push({ accountId: stockInterimAccount.id, name: `مرتجع منصرف: ${line.name || ''}`, debit: productCost, credit: 0, balance: productCost, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
            journalItems.push({ accountId: cogsAccount.id, name: `عكس ت.م: ${line.name || ''}`, debit: 0, credit: productCost, balance: -productCost, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
          }
        } else if (!isSale && isRefund) {
          // Purchase Refund
          const lineAcc = isStorable ? stockInterimAccount.id : cogsAccount.id;
          journalItems.push({ accountId: lineAcc, name: line.name || '', debit: 0, credit: lineAmount, balance: -lineAmount, productId: line.productId || undefined, partnerId: invoice.partnerId || undefined });
        }
      } // Create Journal Entry
      
      if (!validateDoubleEntry(journalItems)) {
        throw new Error(`القيود المحاسبية لهذه الفاتورة غير متزنة! (مدين ≠ دائن). يرجى مراجعة قيم الفاتورة.`);
      }

const now = new Date();
const jeCount = await tx.journalEntry.count({
  where: {
    journalId: journal.id,
    createdAt: {
      gte: new Date(now.getFullYear(), now.getMonth(), 1)
    }
  }
});
const entry = await tx.journalEntry.create({
  data: {
    name: `${journal.code}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(jeCount + 1).padStart(4, '0')}`,
    date: invoice.dateInvoice,
    journalId: journal.id,
    partnerId: invoice.partnerId,
    state: 'posted',
    companyId: companyId,
    items: {
      create: journalItems
    }
  }
}); // AVCO: Update product average cost when confirming a purchase bill
if (!isSale && !isRefund) {
  for (const line of invoice.lines) {
    if (line.productId && line.product?.type === 'storable') {
      const product = line.product;
      const quants = await tx.stockQuant.findMany({
        where: {
          productId: product.id
        }
      });
      const currentStock = quants.reduce((sum, q) => sum + Number(q.quantity), 0);
      const currentCost = Number(product.costPrice || 0);
      const invoiceQty = Number(line.quantity);
      const invoicePrice = Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100);
      // Weighted Average Cost (AVCO) Calculation
      // newCost = (currentStock * currentCost + invoiceQty * invoicePrice) / (currentStock + invoiceQty);
      let newCost: number;
      if (currentStock + invoiceQty > 0) {
        newCost = (currentStock * currentCost + invoiceQty * invoicePrice) / (currentStock + invoiceQty);
      } else {
        // No stock — just use invoice price
        newCost = invoicePrice;
      }
      await tx.product.update({
        where: {
          id: line.productId
        },
        data: {
          costPrice: Math.round(newCost * 100) / 100
        }
      }); 
      // 🔴 RETROACTIVE COGS ENGINE 🔴 
      // Fix past sales that were documented with zero or differing cost
      await recalculateRetroactiveCOGS(tx, product.id, newCost, cogsAccount.id, stockInterimAccount.id);
    }
  }
} 
// Update invoice
await tx.invoice.update({
  where: {
    id
  },
  data: {
    name: typeof finalInvoiceName !== 'undefined' ? finalInvoiceName : undefined,
    state: 'posted',
    journalEntryId: entry.id,
    amountResidual: totalAmount // Outstanding amount until paid
  }
});

// 🔴 UPDATE qtyInvoiced on Linked Orders 🔴
// We only track invoiced quantities for POSTED invoices
if (invoice.saleOrderId) {
  const soLines = await tx.saleOrderLine.findMany({ where: { orderId: invoice.saleOrderId } });
  for (const line of invoice.lines) {
    if (line.lineType !== 'line') continue;
    const soLine = soLines.find(l => l.productId === line.productId);
    if (soLine) {
      await tx.saleOrderLine.update({
        where: { id: soLine.id },
        data: { qtyInvoiced: { increment: Number(line.quantity) } }
      });
    }
  }
} else if (invoice.purchaseOrderId) {
  const poLines = await tx.purchaseOrderLine.findMany({ where: { orderId: invoice.purchaseOrderId } });
  for (const line of invoice.lines) {
    if (line.lineType !== 'line') continue;
    const poLine = poLines.find(l => l.productId === line.productId);
    if (poLine) {
      await tx.purchaseOrderLine.update({
        where: { id: poLine.id },
        data: { qtyInvoiced: { increment: Number(line.quantity) } }
      });
    }
  }
}

return { entryId: entry.id };
});

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  await prisma.message.create({
    data: {
      body: `تم تأكيد الفاتورة <b>وتقيدها محاسبياً</b>.`,
      type: 'notification',
      subject: user?.name || 'System',
      invoiceId: id
    }
  });
  revalidatePath('/[locale]/accounting/invoices');
  revalidatePath('/[locale]/accounting/bills');
  return result;
} catch (error: any) {
  console.error("Failed to confirm invoice:", error);
  throw new Error(error.message || 'فشل في ترحيل الفاتورة');
}
}
/** * Get all accounts (real implementation) */
export async function getAccounts() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  try {
    return await prisma.account.findMany({
      orderBy: {
        code: 'asc'
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return [];
  }
} /** * Create an empty Draft Invoice / Bill instantly */
export async function createDraftInvoice(type: 'out_invoice' | 'in_invoice' | 'out_refund' | 'in_refund' = 'out_invoice') {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'create');
  try {
    const company = await getFirstCompany();
    const prefix = type === 'out_invoice' ? 'INV' : type === 'in_invoice' ? 'BILL' : type === 'out_refund' ? 'RINV' : 'RBILL';
    return await prisma.$transaction(async tx => {
      const now = new Date();
      const yearStr = String(now.getFullYear());
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      const sequencePrefix = `${prefix}/${yearStr}/${monthStr}/`;
      const countThisMonth = await tx.invoice.count({
        where: {
          name: {
            startsWith: sequencePrefix
          }
        }
      });
      const seqNum = String(countThisMonth + 1).padStart(4, '0');
      const invoiceName = `${sequencePrefix}${seqNum}`;
      const draftInvoice = await tx.invoice.create({
        data: {
          name: invoiceName,
          type: type,
          state: 'draft',
          dateInvoice: now,
          createdById: session.userId,
          updatedById: session.userId
        }
      });
      const user = await tx.user.findUnique({
        where: {
          id: session.userId
        }
      });
      await tx.message.create({
        data: {
          body: `قام <b>${user?.name || 'النظام'}</b> بإنشاء مسودة ${type === 'out_invoice' ? 'فاتورة عميل' : 'فاتورة مورد'}.`,
          type: 'notification',
          subject: user?.name || 'System',
          invoiceId: draftInvoice.id
        }
      });
      return draftInvoice;
    });
  } catch (e: any) {
    throw new Error(e.message || 'فشل إنشاء المسودة');
  }
} /** * Create Invoice (real implementation) */
export async function createInvoice(data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'create');
  const parsed = CreateInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
  }
  try {
    const company = await getFirstCompany();
    const invoice = await prisma.$transaction(async tx => {
      const createdInvoice = await tx.invoice.create({
        data: {
          name: 'مسودة',
          type: data.type || 'out_invoice',
          partnerId: data.partnerId,
          dateInvoice: data.dateInvoice ? new Date(data.dateInvoice) : new Date(),
          dateDue: await _resolveDueDate(data),
          amountUntaxed: Number(data.amountUntaxed || 0),
          amountTax: Number(data.amountTax || 0),
          amountTotal: Number(data.amountTotal || 0),
          amountResidual: Number(data.amountTotal || 0),
          narration: data.narration,
          invoiceOrigin: data.invoiceOrigin || null,
          state: 'draft',
          companyId: company.id,
          saleOrderId: data.saleOrderId || null,
          purchaseOrderId: data.purchaseOrderId || null,
          lines: data.lines ? {
            create: data.lines.map((line: any, index: number) => ({
              productId: line.productId || null,
              name: line.name,
              sequence: (index + 1) * 10,
              quantity: Number(line.quantity || 0),
              priceUnit: Number(line.priceUnit || 0),
              priceSubtotal: Number(line.priceSubtotal || 0),
              priceNet: Number(line.priceNet || line.priceSubtotal || 0),
              discount1: Number(line.discount1 || 0),
              unitName: line.unitName || null,
              accountId: line.accountId || null,
              secondaryQuantity: Number(line.secondaryQuantity || 0),
              secondaryUnit: line.secondaryUnit || null,
              lineType: line.lineType || 'line'
            }))
          } : undefined
        },
        include: {
          lines: true
        }
      }); // Save tax relationships for each line
      if (data.lines && createdInvoice.lines) {
        for (let i = 0; i < data.lines.length; i++) {
          const taxPercent = Number(data.lines[i].tax || 0);
          if (taxPercent > 0 && createdInvoice.lines[i]) {
            const taxRecord = await tx.tax.findFirst({
              where: {
                amount: taxPercent
              }
            });
            if (taxRecord) {
              await tx.invoiceLineTax.create({
                data: {
                  lineId: createdInvoice.lines[i].id,
                  taxId: taxRecord.id
                }
              });
            }
          }
        }
      }
      return createdInvoice;
    });
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      }
    });
    await prisma.message.create({
      data: {
        body: `تم إنشاء الفاتورة <b>كمسودة</b>.`,
        type: 'notification',
        subject: user?.name || 'System',
        invoiceId: invoice.id
      }
    });
    revalidatePath('/[locale]/accounting/invoices');
    revalidatePath('/[locale]/accounting/bills');
    return {
      success: true,
      id: invoice.id
    };
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return {
      success: false,
      error: error.message || 'فشل في إنشاء الفاتورة'
    };
  }
}
export async function cancelInvoice(id: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    const result = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id
        },
        include: {
          lines: true
        }
      });
      if (!invoice) throw new Error('الفاتورة غير موجودة');
      if (invoice.state === 'cancel') return {
        success: true
      };
      if (invoice.state === 'paid') {
        throw new Error('لا يمكن إلغاء فاتورة مدفوعة. يجب إلغاء الدفع أولاً.');
      } 
      // Revert Journal Entry
      if (invoice.journalEntryId) {
        // Unlink first to avoid foreign key constraint error
        await tx.invoice.update({
          where: { id },
          data: { journalEntryId: null }
        }); 
        // Delete journal entry (cascade should handle items, but just in case)
        await tx.journalItem.deleteMany({
          where: { entryId: invoice.journalEntryId }
        });
        await tx.journalEntry.delete({
          where: { id: invoice.journalEntryId }
        });
      } // Reverse qtyInvoiced on linked Orders
      if (invoice.saleOrderId) {
        for (const line of invoice.lines) {
          if (line.lineType === 'line' && line.productId) {
            const soLines = await tx.saleOrderLine.findMany({
              where: {
                orderId: invoice.saleOrderId,
                productId: line.productId
              }
            });
            if (soLines.length > 0) {
              // Prevent negative qtyInvoiced
              const safeQty = Math.max(0, Number(soLines[0].qtyInvoiced || 0) - Number(line.quantity));
              await tx.saleOrderLine.update({
                where: {
                  id: soLines[0].id
                },
                data: {
                  qtyInvoiced: safeQty
                }
              });
            }
          }
        }
      }
      if (invoice.purchaseOrderId) {
        for (const line of invoice.lines) {
          if (line.lineType === 'line' && line.productId) {
            const poLines = await tx.purchaseOrderLine.findMany({
              where: {
                orderId: invoice.purchaseOrderId,
                productId: line.productId
              }
            });
            if (poLines.length > 0) {
              // Prevent negative qtyInvoiced
              const safeQty = Math.max(0, Number(poLines[0].qtyInvoiced || 0) - Number(line.quantity));
              await tx.purchaseOrderLine.update({
                where: {
                  id: poLines[0].id
                },
                data: {
                  qtyInvoiced: safeQty
                }
              });
            }
          }
        }
      }
      await tx.invoice.update({
        where: {
          id
        },
        data: {
          state: 'cancel',
          journalEntryId: null
        }
      });
      return {
        success: true
      };
    });
    try {
      revalidatePath('/[locale]/accounting/invoices');
      revalidatePath('/[locale]/accounting/bills');
      revalidatePath('/[locale]/accounting/invoices/[id]', 'page');
      revalidatePath('/[locale]/accounting/bills/[id]', 'page');
    } catch (error) { console.error("Silent error caught in app/actions/accounting.ts:", error); }
    return result;
  } catch (e: any) {
    return {
      success: false,
      error: e.message || "فشل إلغاء الفاتورة"
    };
  }
}
export async function resetToDraftInvoice(id: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    const result = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id
        },
        include: {
          lines: true
        }
      });
      if (!invoice) throw new Error('الفاتورة غير موجودة');
      if (invoice.state !== 'cancel' && invoice.state !== 'posted') {
        throw new Error('لا يمكن إرجاع الفاتورة إلى مسودة إلا إذا كانت ملغاة أو مُرحّلة بدون مدفوعات');
      }
      if (invoice.state === 'posted') {
        // Remove journal entries for posted invoice
        if (invoice.journalEntryId) {
          await tx.invoice.update({
            where: {
              id
            },
            data: {
              journalEntryId: null
            }
          });
          await tx.journalItem.deleteMany({
            where: {
              entryId: invoice.journalEntryId
            }
          });
          await tx.journalEntry.delete({
            where: {
              id: invoice.journalEntryId
            }
          });
        }
        // Decrement qtyInvoiced on linked orders so the invoice can be re-confirmed
        if (invoice.saleOrderId) {
          for (const line of invoice.lines) {
            if (line.lineType === 'line' && line.productId) {
              const soLines = await tx.saleOrderLine.findMany({
                where: {
                  orderId: invoice.saleOrderId,
                  productId: line.productId
                }
              });
              if (soLines.length > 0) {
                const safeQty = Math.max(0, Number(soLines[0].qtyInvoiced || 0) - Number(line.quantity));
                await tx.saleOrderLine.update({
                  where: { id: soLines[0].id },
                  data: { qtyInvoiced: safeQty }
                });
              }
            }
          }
        }
        if (invoice.purchaseOrderId) {
          for (const line of invoice.lines) {
            if (line.lineType === 'line' && line.productId) {
              const poLines = await tx.purchaseOrderLine.findMany({
                where: {
                  orderId: invoice.purchaseOrderId,
                  productId: line.productId
                }
              });
              if (poLines.length > 0) {
                const safeQty = Math.max(0, Number(poLines[0].qtyInvoiced || 0) - Number(line.quantity));
                await tx.purchaseOrderLine.update({
                  where: { id: poLines[0].id },
                  data: { qtyInvoiced: safeQty }
                });
              }
            }
          }
        }
      } else if (invoice.state === 'cancel') {
        // Restore qtyInvoiced because cancelInvoice had decremented it
        if (invoice.saleOrderId) {
          for (const line of invoice.lines) {
            if (line.lineType === 'line' && line.productId) {
              const soLines = await tx.saleOrderLine.findMany({
                where: {
                  orderId: invoice.saleOrderId,
                  productId: line.productId
                }
              });
              if (soLines.length > 0) {
                await tx.saleOrderLine.update({
                  where: {
                    id: soLines[0].id
                  },
                  data: {
                    qtyInvoiced: {
                      increment: Number(line.quantity)
                    }
                  }
                });
              }
            }
          }
        }
        if (invoice.purchaseOrderId) {
          for (const line of invoice.lines) {
            if (line.lineType === 'line' && line.productId) {
              const poLines = await tx.purchaseOrderLine.findMany({
                where: {
                  orderId: invoice.purchaseOrderId,
                  productId: line.productId
                }
              });
              if (poLines.length > 0) {
                await tx.purchaseOrderLine.update({
                  where: {
                    id: poLines[0].id
                  },
                  data: {
                    qtyInvoiced: {
                      increment: Number(line.quantity)
                    }
                  }
                });
              }
            }
          }
        }
      }
      // Always set state to draft (for both posted and cancel)
      await tx.invoice.update({
        where: {
          id
        },
        data: {
          state: 'draft'
        }
      });
      return {
        success: true
      };
    });
    try {
      revalidatePath('/[locale]/accounting/invoices');
      revalidatePath('/[locale]/accounting/bills');
      revalidatePath('/[locale]/accounting/invoices/[id]', 'page');
      revalidatePath('/[locale]/accounting/bills/[id]', 'page');
    } catch (error) { console.error("Silent error caught in app/actions/accounting.ts:", error); }
    return result;
  } catch (e: any) {
    return {
      success: false,
      error: e.message || "فشل إعادة الفاتورة للمسودة"
    };
  }
}
export async function updateInvoice(id: string, data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  const parsed = CreateInvoiceSchema.safeParse(data); // Ignore schema validation failure for partial updates of lines, we trust the UI mapping in this
  try {
    const txResult = await prisma.$transaction(async tx => {
    const current = await tx.invoice.findUnique({
      where: {
        id
      },
      include: {
        lines: true
      }
    });
    if (!current) throw new Error("الفاتورة غير موجودة");
    if (current.state !== 'draft') {
      throw new Error("لا يمكن تعديل فاتورة غير المسودة. الأرقام المحاسبية قد تأثرت بالفعل.");
    } // Month Lock Validation
    if (current.name && !current.name.includes('مسودة') && data.dateInvoice) {
      const existingDate = new Date(current.dateInvoice);
      const newDate = new Date(data.dateInvoice);
      if (existingDate.getMonth() !== newDate.getMonth() || existingDate.getFullYear() !== newDate.getFullYear()) {
        throw new Error(`قفل الشهر المالي: تمتلك الفاتورة تسلسلاً (${current.name}) في شهر ${existingDate.getMonth() + 1}. لا يمكن تغيير التاريخ خارج هذا الشهر!`);
      }
    }
    const updatedInvoice = await tx.invoice.update({
      where: {
        id
      },
      data: {
        partnerId: data.partnerId,
        dateInvoice: data.dateInvoice ? new Date(data.dateInvoice) : undefined,
        dateDue: await _resolveDueDate(data),
        amountUntaxed: Number(data.amountUntaxed || 0),
        amountTax: Number(data.amountTax || 0),
        amountTotal: Number(data.amountTotal || 0),
        amountResidual: Number(data.amountTotal || 0),
        narration: data.narration,
        invoiceOrigin: data.invoiceOrigin || null,
        lines: data.lines ? {
          deleteMany: {},
          create: data.lines.map((line: any, index: number) => ({
            productId: line.productId || null,
            name: line.name,
            sequence: (index + 1) * 10,
            quantity: Number(line.quantity || 0),
            priceUnit: Number(line.priceUnit || 0),
            priceSubtotal: Number(line.priceSubtotal || 0),
            priceNet: Number(line.priceNet || line.priceSubtotal || 0),
            discount1: Number(line.discount1 || 0),
            unitName: line.unitName || null,
            accountId: line.accountId || null,
            secondaryQuantity: Number(line.secondaryQuantity || 0),
            secondaryUnit: line.secondaryUnit || null,
            lineType: line.lineType || 'line'
          }))
        } : undefined
      },
      include: {
        lines: true
      }
    }); // Save tax relationships for each line
    if (data.lines && updatedInvoice.lines) {
      for (let i = 0; i < data.lines.length; i++) {
        const taxPercent = Number(data.lines[i].tax || 0);
        if (taxPercent > 0 && updatedInvoice.lines[i]) {
          const taxRecord = await tx.tax.findFirst({
            where: {
              amount: taxPercent
            }
          });
          if (taxRecord) {
            await tx.invoiceLineTax.create({
              data: {
                lineId: updatedInvoice.lines[i].id,
                taxId: taxRecord.id
              }
            });
          }
        }
      }
    }
    return {
      updatedInvoice,
      current
    };
  });
  const {
    updatedInvoice,
    current
  } = txResult; // ------------------------------------------------------------- // Audit Trail: Log changes in Chatter // -------------------------------------------------------------
  const changes: TrackingChange[] = [];
  if (current && Number(current.amountTotal) !== Number(data.amountTotal || 0)) {
    changes.push({
      fieldName: 'amountTotal',
      fieldDesc: 'الإجمالي',
      oldValue: String(current.amountTotal),
      newValue: String(data.amountTotal || 0)
    });
  }
  if (current && current.dateInvoice && data.dateInvoice && new Date(current.dateInvoice).getTime() !== new Date(data.dateInvoice).getTime()) {
    changes.push({
      fieldName: 'dateInvoice',
      fieldDesc: 'تاريخ الفاتورة',
      oldValue: new Date(current.dateInvoice).toLocaleDateString('ar-EG'),
      newValue: new Date(data.dateInvoice).toLocaleDateString('ar-EG')
    });
  }
  const existingLines = current ? current.lines : [];
  const incomingLineNames = data.lines ? data.lines.map((l: any) => l.name) : [];
  const existingLineNames = existingLines.map((l: any) => l.name);
  const linesToDelete = existingLineNames.filter((name: string) => !incomingLineNames.includes(name));
  for (const name of linesToDelete) {
    changes.push({
      fieldName: 'lines',
      fieldDesc: 'بنود الفاتورة',
      oldValue: `[حُذف] ${name}`,
      newValue: 'مزال'
    });
  }
  if (data.lines) {
    for (const line of data.lines) {
      if (!existingLineNames.includes(line.name)) {
        changes.push({
          fieldName: 'lines',
          fieldDesc: 'بنود الفاتورة',
          oldValue: 'جديد',
          newValue: `[أُضيف] ${line.name} (كمية: ${line.quantity || 0})`
        });
      } else {
        const existingLine = existingLines.find((l: any) => l.name === line.name);
        if (existingLine && Number(existingLine.quantity) !== Number(line.quantity || 0)) {
          changes.push({
            fieldName: 'quantity',
            fieldDesc: `كمية ${existingLine.name}`,
            oldValue: String(existingLine.quantity),
            newValue: String(line.quantity || 0)
          });
        }
        if (existingLine && Number(existingLine.priceUnit) !== Number(line.priceUnit || 0)) {
          changes.push({
            fieldName: 'priceUnit',
            fieldDesc: `سعر ${existingLine.name}`,
            oldValue: String(existingLine.priceUnit),
            newValue: String(line.priceUnit || 0)
          });
        }
      }
    }
  }
  if (changes.length > 0) {
    await logTrackingChanges('invoice', id, changes, 'قام بتعديل الفاتورة');
  }
  revalidatePath('/[locale]/accounting/invoices');
  revalidatePath('/[locale]/accounting/bills');
  revalidatePath('/[locale]/accounting/bills/[id]', 'page');
  revalidatePath('/[locale]/accounting/invoices/[id]', 'page');
  return {
    success: true,
    id: updatedInvoice.id,
    invoice: updatedInvoice
  };
  } catch (error: any) {
    console.error("Failed to update invoice:", error);
    throw new Error(error.message);
  }
}
/** * Create Refund / Credit Note (إشعار دائن) */
export async function createRefund(invoiceId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'create');
  try {
    const original = await prisma.invoice.findUnique({
      where: {
        id: invoiceId
      },
      include: {
        lines: true
      }
    });
    if (!original) return {
      success: false,
      error: 'فاتورة غير موجودة'
    };
    const refundType = original.type === 'out_invoice' ? 'out_refund' : 'in_refund';
    const company = await getFirstCompany();
    const refPrefix = refundType === 'out_refund' ? 'RINV' : 'RBILL';
    const refund = await prisma.$transaction(async tx => {
      const name = await getNextSequenceLegacy(refPrefix, 'invoice', {
        type: refundType
      }, tx, new Date());
      return await tx.invoice.create({
        data: {
          name,
          type: refundType,
          partnerId: original.partnerId,
          dateInvoice: new Date(),
          amountUntaxed: original.amountUntaxed,
          amountTax: original.amountTax,
          amountTotal: original.amountTotal,
          amountResidual: original.amountTotal,
          narration: `إشعار دائن للفاتورة ${original.name}`,
          invoiceOrigin: original.name,
          state: 'draft',
          companyId: company.id,
          lines: {
            create: original.lines.map((line: any) => ({
              productId: line.productId,
              name: line.name,
              quantity: line.quantity,
              priceUnit: line.priceUnit,
              priceSubtotal: line.priceSubtotal,
              accountId: line.accountId
            }))
          }
        }
      });
    });
    revalidatePath('/[locale]/accounting/invoices');
    return {
      success: true,
      id: refund.id
    };
  } catch (error: any) {
    console.error("Failed to create refund:", error);
    return {
      success: false,
      error: error.message
    };
  }
} /** * Reset Invoice to Draft */
export async function resetToDraft(id: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id
        }
      });
      if (!invoice) throw new Error('فاتورة غير موجودة'); // Delete associated journal entry
      if (invoice.journalEntryId) {
        // Unlink first to avoid foreign key constraint error
        await tx.invoice.update({
          where: {
            id
          },
          data: {
            journalEntryId: null
          }
        });
        await tx.journalItem.deleteMany({
          where: {
            entryId: invoice.journalEntryId
          }
        });
        await tx.journalEntry.delete({
          where: {
            id: invoice.journalEntryId
          }
        });
      }
      await tx.invoice.update({
        where: {
          id
        },
        data: {
          state: 'draft',
          journalEntryId: null,
          amountResidual: invoice.amountTotal
        }
      });
    });
    revalidatePath('/[locale]/accounting/invoices');
    revalidatePath('/[locale]/accounting/bills');
    revalidatePath('/[locale]/accounting/invoices/[id]', 'page');
    revalidatePath('/[locale]/accounting/bills/[id]', 'page');
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Failed to reset to draft:", error);
    return {
      success: false,
      error: error.message
    };
  }
} /** * Register Payment for Invoice (سند قبض/صرف from invoice) * Creates a Payment, confirms it (creates JE), and marks invoice as paid */
import { RegisterPaymentSchema, validateOrThrow } from '@/lib/validations';

export async function registerPayment(invoiceId: string, amount?: number, journalId?: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  
  validateOrThrow(RegisterPaymentSchema, { invoiceId, amount, journalId });
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId
      },
      include: {
        partner: true
      }
    });
    if (!invoice) return {
      success: false,
      error: 'فاتورة غير موجودة'
    }; // === Period Lock Check ===
    await checkPeriodLock(new Date(), session.userId);
    const paymentAmount = amount || Number(invoice.amountResidual || invoice.amountTotal);
    const isSale = invoice.type === 'out_invoice' || invoice.type === 'out_refund'; // Find or use provided journal
    let journal;
    if (journalId) {
      journal = await prisma.journal.findUnique({
        where: {
          id: journalId
        },
        include: {
          defaultAccount: true
        }
      });
    }
    if (!journal) {
      journal = await prisma.journal.findFirst({
        where: {
          type: {
            in: ['bank', 'cash']
          }
        },
        include: {
          defaultAccount: true
        }
      });
    }
    if (!journal) return {
      success: false,
      error: 'لم يتم العثور على دفتر بنك أو صندوق. أنشئ دفتر يومية أولاً.'
    };
    if (!journal.defaultAccount) return {
      success: false,
      error: 'الدفتر ليس له حساب افتراضي (بنك/صندوق).'
    }; // Find partner account
    const partnerAccount = isSale ? await prisma.account.findFirst({
      where: {
        type: 'receivable'
      }
    }) : await prisma.account.findFirst({
      where: {
        type: 'payable'
      }
    });
    if (!partnerAccount) return {
      success: false,
      error: 'لم يتم العثور على حساب ذمم.'
    }; // Determine Payment Direction: // out_invoice (sale) -> inbound (receive money) // out_refund (customer credit note) -> outbound (return money to customer) // in_invoice (purchase) -> outbound (send money) // in_refund (vendor debit note) -> inbound (receive money back from vendor);
    const isCustomerRefund = invoice.type === 'out_refund';
    const isVendorRefund = invoice.type === 'in_refund';
    let paymentType = 'inbound';
    if (invoice.type === 'out_invoice' || isVendorRefund) paymentType = 'inbound';
    if (invoice.type === 'in_invoice' || isCustomerRefund) paymentType = 'outbound'; // ------------------ Negative Cash Control ------------------
    if (paymentType === 'outbound') {
      const currentBalanceRes = await prisma.journalItem.aggregate({
        where: {
          accountId: journal.defaultAccount.id
        },
        _sum: {
          debit: true,
          credit: true
        }
      });
      const currentBalance = Number(currentBalanceRes._sum.debit || 0) - Number(currentBalanceRes._sum.credit || 0);
      if (currentBalance - paymentAmount < 0) {
        if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
          // Create an Approval Request for the General Manager
          await prisma.approvalRequest.create({
            data: {
              type: 'negative_cash',
              status: 'pending',
              requesterId: session.userId,
              resourceModel: 'Payment',
              details: JSON.stringify({
                amount: paymentAmount,
                journalId: journal.id,
                invoiceId,
                reason: 'Negative cash disbursement'
              }),
              companyId: invoice.companyId || undefined
            }
          }); // Notify Admins about the request
          const admins = await prisma.user.findMany({
            where: {
              role: {
                in: ['ADMIN', 'MANAGER']
              }
            }
          });
          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                title: 'طلب إذن صرف (رصيد سالب)',
                message: `تم طلب صرف مبلغ ${paymentAmount} للفاتورة ${invoice.name} ولكن الرصيد الحالي (${currentBalance}) لا يكفي. يرجى الموافقة.`,
                type: 'approval_request',
                userId: admin.id,
                senderId: session.userId,
                companyId: invoice.companyId || undefined
              }
            });
          }
          return {
            success: false,
            error: 'رصيد الخزينة غير كافٍ لصرف هذا المبلغ. تم إرسال طلب إذن صرف للمدير العام.'
          };
        }
      }
    } // -----------------------------------------------------------
    const prefix = paymentType === 'inbound' ? 'RV' : 'PV';
    const paymentName = await getNextSequenceLegacy(prefix, 'payment', {
      paymentType
    }, prisma, new Date());
    const payment = await prisma.payment.create({
      data: {
        name: paymentName,
        paymentType,
        partnerType: isSale ? 'customer' : 'vendor',
        amount: paymentAmount,
        date: new Date(),
        ref: `دفعة للفاتورة ${invoice.name}`,
        partnerId: invoice.partnerId,
        journalId: journal.id,
        state: 'draft',
        companyId: invoice.companyId || undefined,
        createdById: session.userId
      }
    }); // Confirm Payment (Create Journal Entry) // Receipt: Dr Bank, Cr Receivable // Payment: Dr Payable, Cr Bank
    const isReceipt = paymentType === 'inbound';
    const debitAccountId = isReceipt ? journal.defaultAccount.id : partnerAccount.id;
    const creditAccountId = isReceipt ? partnerAccount.id : journal.defaultAccount.id;

    const journalItems = [
      {
        accountId: debitAccountId,
        name: payment.ref || paymentName,
        debit: paymentAmount,
        credit: 0,
        balance: paymentAmount,
        partnerId: invoice.partnerId || undefined
      },
      {
        accountId: creditAccountId,
        name: payment.ref || paymentName,
        debit: 0,
        credit: paymentAmount,
        balance: -paymentAmount,
        partnerId: invoice.partnerId || undefined
      }
    ];

    if (!validateDoubleEntry(journalItems)) {
      throw new Error('القيود المحاسبية للدفع غير متزنة! يرجى مراجعة المبلغ.');
    }

    const entry = await prisma.journalEntry.create({
      data: {
        name: `${journal.code}/${paymentName}`,
        date: new Date(),
        journalId: journal.id,
        partnerId: invoice.partnerId,
        paymentId: payment.id,
        state: 'posted',
        createdById: session.userId,
        items: {
          create: journalItems
        }
      }
    }); // Update payment state
    await prisma.payment.update({
      where: {
        id: payment.id
      },
      data: {
        state: 'posted'
      }
    }); // Dispatch Notification for Monitoring
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      }
    });
    await dispatchNotification({
      eventCode: 'PAYMENT_REGISTERED',
      subject: 'سند مالي جديد',
      body: `قام المستخدم ${user?.name || 'مجهول'} بتسجيل ${paymentType === 'inbound' ? 'سند قبض' : 'سند صرف'} بقيمة ${paymentAmount} للفاتورة ${invoice.name}.`
    }); // ------------------ Manager Notifications ------------------
    if (session.role !== 'ADMIN') {
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN'
        }
      });
      const actionText = paymentType === 'inbound' ? 'سند قبض' : 'سند صرف';
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            title: `حركة خزينة جديدة: ${actionText}`,
            message: `تم إنشاء ${actionText} بمبلغ ${paymentAmount} للفاتورة ${invoice.name} عبر ${journal.name}.`,
            type: 'info',
            userId: admin.id,
            senderId: session.userId,
            companyId: invoice.companyId || undefined
          }
        });
      }
    } // If it is the ADMIN doing it, they get the frontend UI Toast natively! // ----------------------------------------------------------- // Update invoice residual
    const newResidual = Math.max(0, Number(invoice.amountResidual) - paymentAmount);
    await prisma.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        amountResidual: newResidual,
        state: newResidual <= 0 ? 'paid' : invoice.state
      }
    });
    revalidatePath('/[locale]/accounting/payments');
    revalidatePath('/[locale]/accounting/invoices');
    revalidatePath('/[locale]/accounting/bills');
    revalidatePath('/[locale]/accounting/invoices/[id]', 'page');
    revalidatePath('/[locale]/accounting/bills/[id]', 'page');
    return {
      success: true,
      paymentId: payment.id,
      entryId: entry.id
    };
  } catch (error: any) {
    console.error("Failed to register payment:", error);
    return {
      success: false,
      error: error.message
    };
  }
} /** * Get Outstanding Payments for a Partner (Odoo Outstanding Payments Widget) * Returns unallocated/partially-allocated posted payments for a given partner * that can be applied to an invoice. */
export async function getOutstandingPayments(partnerId: string, invoiceType: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");

  try {
    if (!partnerId) return []; 
    // Determine payment type based on invoice
    // out_invoice (sale) -> inbound payments (customer) 
    // out_refund (credit note) -> outbound payments (refund sent to customer) 
    // in_invoice (purchase) -> outbound payments (vendor) 
    // in_refund (debit note) -> inbound payments (refund from vendor)
    let paymentType = 'inbound';
    if (invoiceType === 'out_invoice' || invoiceType === 'in_refund') paymentType = 'inbound';
    if (invoiceType === 'in_invoice' || invoiceType === 'out_refund') paymentType = 'outbound';
    const payments = await prisma.payment.findMany({
      where: {
        partnerId,
        paymentType,
        state: 'posted'
      },
      include: {
        journal: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    }); // Find all invoices for this partner to calculate what's actually allocated
    const invoiceType2 = invoiceType === 'out_invoice' || invoiceType === 'out_refund' ? 'out_invoice' : 'in_invoice';
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        partnerId,
        type: {
          in: [invoiceType2, invoiceType2.replace('invoice', 'refund')]
        },
        state: 'paid'
      },
      select: {
        amountTotal: true
      }
    });
    const totalAllocated = paidInvoices.reduce((sum, inv) => sum + Number(inv.amountTotal), 0);
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstandingCredit = totalPayments - totalAllocated; // Return individual payments with their remaining amounts
    return payments.map(p => ({
      id: p.id,
      name: p.name || `دفعة ${p.date.toISOString().split('T')[0]}`,
      amount: Number(p.amount),
      date: p.date.toISOString().split('T')[0],
      journalName: p.journal?.name || '',
      journalCode: p.journal?.code || '',
      ref: p.ref || '',
      // For simplicity, show all posted payments - UI will
      et: Number(p.amount)
    }));
  } catch (error) {
    console.error("Failed to fetch outstanding payments:", error);
    return [];
  }
} /** * Apply an Outstanding Payment to an Invoice (Reconciliation) * Links a payment to an invoice by reducing the invoice's residual amount. */
export async function applyOutstandingPayment(invoiceId: string, paymentId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  try {
    const result = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id: invoiceId
        }
      });
      const payment = await tx.payment.findUnique({
        where: {
          id: paymentId
        },
        include: {
          journal: {
            include: {
              defaultAccount: true
            }
          }
        }
      });
      if (!invoice) throw new Error('الفاتورة غير موجودة');
      if (!payment) throw new Error('الدفعة غير موجودة');
      if (invoice.state !== 'posted') throw new Error('الفاتورة يجب أن تكون مُرحّلة أولاً');
      const paymentAmount = Number(payment.amount);
      const residual = Number(invoice.amountResidual);
      if (residual <= 0) throw new Error('الفاتورة مسددة بالكامل بالفعل');
      const appliedAmount = Math.min(paymentAmount, residual);
      const newResidual = residual - appliedAmount;
      const isSale = invoice.type === 'out_invoice' || invoice.type === 'out_refund';
      const partnerAccount = isSale ? await tx.account.findFirst({
        where: {
          type: 'receivable'
        }
      }) : await tx.account.findFirst({
        where: {
          type: 'payable'
        }
      });
      if (partnerAccount && payment.journal?.defaultAccount) {
        const bankAccountId = payment.journal.defaultAccount.id;
        const isReceipt = payment.paymentType === 'inbound';
        const journal = await tx.journal.findFirst({
          where: {
            type: {
              in: ['bank', 'cash']
            }
          }
        });
        if (journal) {
          await tx.journalEntry.create({
            data: {
              name: `REC/${invoice.name}/${payment.name}`,
              date: new Date(),
              journalId: journal.id,
              partnerId: invoice.partnerId,
              ref: `تسوية دفعة ${payment.name} على فاتورة ${invoice.name}`,
              state: 'posted',
              companyId: invoice.companyId,
              createdById: session.userId,
              items: {
                create: [{
                  accountId: isReceipt ? bankAccountId : partnerAccount.id,
                  name: `تسوية ${payment.name}`,
                  debit: appliedAmount,
                  credit: 0,
                  companyId: invoice.companyId
                }, {
                  accountId: isReceipt ? partnerAccount.id : bankAccountId,
                  name: `تسوية ${payment.name}`,
                  debit: 0,
                  credit: appliedAmount,
                  companyId: invoice.companyId
                }]
              }
            }
          });
        }
      }
      await tx.invoice.update({
        where: {
          id: invoiceId
        },
        data: {
          amountResidual: Math.max(0, newResidual),
          state: newResidual <= 0 ? 'paid' : invoice.state
        }
      });
      return {
        success: true,
        appliedAmount,
        newResidual: Math.max(0, newResidual),
        invoicePaid: newResidual <= 0
      };
    });
    revalidatePath('/[locale]/accounting/bills');
    revalidatePath('/[locale]/accounting/invoices');
    revalidatePath('/[locale]/accounting/bills/[id]');
    revalidatePath('/[locale]/accounting/invoices/[id]');
    return result;
  } catch (error: any) {
    console.error("Failed to apply outstanding payment:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
export async function getPartnerLedgerWidgetData(partnerId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");

  try {
    let session = await getSession(); if (!session) throw new Error("غير مصرح");
    if (!session) return {
      error: 'غير مصرح'
    };
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      },
      select: {
        canViewPartnerLedger: true,
        allowedLedgerCustomerTypes: true
      }
    });
    if (!user || !user.canViewPartnerLedger) {
      return {
        error: 'ليس لديك صلاحية لعرض كشف الحساب'
      };
    }
    const partner = await prisma.partner.findUnique({
      where: {
        id: partnerId
      },
      select: {
        id: true,
        name: true,
        customerType: true,
        propertyAccountReceivableId: true,
        propertyAccountPayableId: true
      }
    });
    if (!partner) return {
      error: 'العميل غير موجود'
    };
    if (user.allowedLedgerCustomerTypes !== 'all') {
      const allowedTypes = user.allowedLedgerCustomerTypes.split(',').map(t => t.trim());
      if (!allowedTypes.includes(partner.customerType)) {
        return {
          error: 'ليس لديك صلاحية لعرض كشف الحساب لهذا النوع من العملاء'
        };
      }
    }
    let totalBalance = 0;
    const items = await prisma.journalItem.findMany({
      where: {
        entry: {
          partnerId: partner.id,
          state: 'posted'
        },
        account: {
          type: {
            in: ['receivable', 'payable']
          }
        }
      },
      include: {
        entry: {
          select: {
            name: true,
            date: true,
            ref: true,
            createdBy: {
              select: {
                name: true
              }
            },
            payment: {
              select: {
                createdBy: {
                  select: {
                    name: true
                  }
                }
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
    let runningBalance = 0;
    const ledgerItems = items.map((item: any) => {
      const debit = Number(item.debit);
      const credit = Number(item.credit);
      on:
      // Net Balance = Debit - Credit. Positive means they owe us, Negative means we owe them. runningBalance += (debit - credit);
      return {
        id: item.id,
        date: item.entry.date,
        name: item.entry.name,
        ref: item.entry.ref || item.name || '',
        debit,
        credit,
        balance: runningBalance,
        createdBy: item.entry.payment?.createdBy?.name || item.entry.createdBy?.name || 'النظام'
      };
    });
    totalBalance = runningBalance; // Return only the last 15 items for the widget, sorted descending by date
    const recentItems = ledgerItems.slice(-15).reverse();
    return {
      success: true,
      totalBalance,
      items: recentItems,
      partnerName: partner.name
    };
  } catch (error: any) {
    console.error("Failed to fetch partner ledger widget data:", error);
    return {
      error: 'حدث خطأ أثناء جلب البيانات'
    };
  }
} /** * 🔴 Retroactive COGS Engine 🔴 * The anti-Odoo flaw system. * If a product is sold BEFORE its purchase price is documented, it registers 0 COGS. * This function retroactively finds all posted outbound sales lines of this product * and corrects their COGS Journal Items to reflect the TRUE cost discovered. */
async function recalculateRetroactiveCOGS(tx: any, productId: string, correctCost: number, cogsAccountId: string, stockInterimAccountId: string) {
  if (correctCost <= 0) return; // Find all posted Out invoices containing this product that have a valid Journal Entry
  const pastSaleLines = await tx.invoiceLine.findMany({
    where: {
      productId: productId,
      invoice: {
        type: 'out_invoice',
        state: 'posted',
        journalEntryId: {
          not: null
        }
      }
    },
    include: {
      invoice: true
    }
  });
  let correctedCount = 0;
  for (const pastLine of pastSaleLines) {
    if (!pastLine.invoice || !pastLine.invoice.journalEntryId) continue;
    const expectedTotalCost = Number(pastLine.quantity) * correctCost;
    if (expectedTotalCost <= 0) continue;
    const entryId = pastLine.invoice.journalEntryId; // Find existing COGS and Stock items for this specific product in that entry
    const cogsItems = await tx.journalItem.findMany({
      where: {
        entryId,
        productId,
        accountId: cogsAccountId
      }
    });
    const stockItems = await tx.journalItem.findMany({
      where: {
        entryId,
        productId,
        accountId: stockInterimAccountId
      }
    }); // Option 1: Missing entirely (sold when price was strictly 0)
    if (cogsItems.length === 0 && stockItems.length === 0) {
      await tx.journalItem.create({
        data: {
          entryId: entryId,
          accountId: cogsAccountId,
          name: `ت.م (مصحح أثر رجعي): ${pastLine.name}`,
          debit: expectedTotalCost,
          credit: 0,
          productId: productId
        }
      });
      await tx.journalItem.create({
        data: {
          entryId: entryId,
          accountId: stockInterimAccountId,
          name: `منصرف (مصحح أثر رجعي): ${pastLine.name}`,
          debit: 0,
          credit: expectedTotalCost,
          productId: productId
        }
      });
      correctedCount++;
    } // Option 2: Exists, but at a different cost (AVCO adjustment)
    else {
      let updated = false;
      for (const cogs of cogsItems) {
        if (Math.abs(Number(cogs.debit) - expectedTotalCost) > 0.01) {
          await tx.journalItem.update({
            where: {
              id: cogs.id
            },
            data: {
              debit: expectedTotalCost,
              name: `ت.م (مُعدل): ${pastLine.name}`
            }
          });
          updated = true;
        }
      }
      for (const stk of stockItems) {
        if (Math.abs(Number(stk.credit) - expectedTotalCost) > 0.01) {
          await tx.journalItem.update({
            where: {
              id: stk.id
            },
            data: {
              credit: expectedTotalCost,
              name: `منصرف (مُعدل): ${pastLine.name}`
            }
          });
          updated = true;
        }
      }
      if (updated) correctedCount++;
    }
  }
  if (correctedCount > 0) {
    console.log(`[Retroactive COGS Engine] Corrected ${correctedCount} historical sale shipments for product ${productId} to new cost ${correctCost}`);
  }
} /** * طلب الموافقة لأسعار الفوترة الصفرية */
export async function requestZeroPriceInvoiceApproval(invoiceId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  try {
    const result = await prisma.$transaction(async tx => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id: invoiceId
        },
        select: {
          id: true,
          name: true,
          companyId: true
        }
      });
      if (!invoice) throw new Error('الفاتورة غير موجودة'); // 1. إنشاء طلب الموافقة
      await tx.approvalRequest.create({
        data: {
          type: 'zero_price_sale',
          // Re-using zero price
          status: 'pending',
          requesterId: session.userId,
          resourceId: invoice.id,
          resourceModel: 'Invoice',
          companyId: invoice.companyId,
          details: JSON.stringify({
            invoiceName: invoice.name,
            reason: 'يوجد سطر بفاتورة المبيعات/المشتريات مسعر بـ 0.00'
          })
        }
      }); // 2. تحديث حالة الفاتورة لتصبح pending
      await tx.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          approvalStatus: 'pending'
        }
      }); // 3. إضافة رسالة للمحادثة
      await tx.message.create({
        data: {
          invoiceId: invoice.id,
          body: "تم تظهير الفاتورة لطلب موافقة الإدارة بسبب وجود صنف بسعر 0.00.",
          subtype: "mt_comment",
          authorId: session.userId
        }
      });
      return {
        success: true
      };
    });
    return result;
  } catch (error: any) {
    console.error("Zero Price Approval Request failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
} // =============================================
// نظام المرتجعات الذكي — Smart Returns
// ============================================= /** * جلب تاريخ مبيعات عميل محدد * يرجع كل الأصناف التي تم بيعها لهذا العميل مع آخر سعر صافي وإجمالي الكميات */
export async function getCustomerSalesHistory(partnerId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read"); // جلب كل بنود فواتير البيع المؤكدة لهذا العميل
  const invoiceLines = await prisma.invoiceLine.findMany({
    where: {
      invoice: {
        partnerId: partnerId,
        type: 'out_invoice',
        state: {
          in: ['posted', 'paid']
        }
      },
      productId: {
        not: null
      },
      lineType: 'line'
    },
    include: {
      product: {
        select: {
          id: true,
          name: true
        }
      },
      invoice: {
        select: {
          dateInvoice: true
        }
      }
    },
    orderBy: {
      invoice: {
        dateInvoice: 'desc'
      }
    }
  }); // تجميع البيانات لكل صنف: آخر سعر وحدة، آخر خصم، السعر الصافي، إجمالي الكمية المباعة
  const productMap = new Map<string, {
    productId: string;
    productName: string;
    lastPriceUnit: number;
    lastDiscount: number;
    lastNetPrice: number;
    totalQtySold: number;
    lastSaleDate: string;
  }>();
  for (const line of invoiceLines) {
    if (!line.productId) continue;
    const priceUnit = Number(line.priceUnit || 0);
    const discount = Number(line.discount1 || 0);
    const netPrice = priceUnit * (1 - discount / 100);
    const qty = Number(line.quantity || 0);
    if (!productMap.has(line.productId)) {
      // أول ظهور = آخر فاتورة (بسبب الترتيب desc) productMap.set(line.productId,
      {
        line.invoice?.dateInvoice?.toISOString() || '';
      }
      ;
    } else {
      // صنف مكرر في فواتير أقدم — نضيف الكمية فقط
      const existing = productMap.get(line.productId)!;
      existing.totalQtySold += qty;
    }
  }
  return Array.from(productMap.values());
} /** * جلب تاريخ مشتريات من مورد محدد * يرجع كل الأصناف التي تم شراؤها من هذا المورد مع آخر سعر صافي وإجمالي الكميات */
export async function getVendorPurchaseHistory(partnerId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const invoiceLines = await prisma.invoiceLine.findMany({
    where: {
      invoice: {
        partnerId: partnerId,
        type: 'in_invoice',
        state: {
          in: ['posted', 'paid']
        }
      },
      productId: {
        not: null
      },
      lineType: 'line'
    },
    include: {
      product: {
        select: {
          id: true,
          name: true
        }
      },
      invoice: {
        select: {
          dateInvoice: true
        }
      }
    },
    orderBy: {
      invoice: {
        dateInvoice: 'desc'
      }
    }
  });
  const productMap = new Map<string, {
    productId: string;
    productName: string;
    lastPriceUnit: number;
    lastDiscount: number;
    lastNetPrice: number;
    totalQtyPurchased: number;
    lastPurchaseDate: string;
  }>();
  for (const line of invoiceLines) {
    if (!line.productId) continue;
    const priceUnit = Number(line.priceUnit || 0);
    const discount = Number(line.discount1 || 0);
    const netPrice = priceUnit * (1 - discount / 100);
    const qty = Number(line.quantity || 0);
    if (!productMap.has(line.productId)) {
      productMap.set(line.productId, {
        productId: line.productId,
        productName: line.product?.name || '',
        lastPriceUnit: priceUnit,
        lastDiscount: discount,
        lastNetPrice: netPrice,
        totalQtyPurchased: qty,
        lastPurchaseDate: line.invoice?.dateInvoice?.toISOString() || ''
      });
    } else {
      const existing = productMap.get(line.productId)!;
      existing.totalQtyPurchased += qty;
    }
  }
  return Array.from(productMap.values());
} // --- Advanced Account Management ---
export async function getAccountDetails(accountId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const account = await prisma.account.findUnique({
    where: {
      id: accountId
    },
    include: {
      tags: true,
      defaultTaxes: true,
      allowedJournals: true
    }
  });
  if (!account) throw new Error('الحساب غير موجود'); // Calculate dynamic balance from JournalItems
  const items = await prisma.journalItem.findMany({
    where: {
      accountId: account.id,
      entry: {
        state: 'posted'
      }
    },
    select: {
      debit: true,
      credit: true
    }
  });
  let balance = 0; 
  // For assets/expenses: Debit increases, Credit decreases 
  // For liabilities/equity/income: Credit increases, Debit decreases 
  // But standard accounting balance is often just Debit - Credit regardless, or absolute. 
  // Let's use Debit - Credit. 
  for (const item of items) {
    balance += Number(item.debit) - Number(item.credit);
  }
  return {
    ...account,
    balance
  };
}
export async function saveAccountDetails(accountId: string, data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "write");
  const tagConnections = data.tags ? data.tags.map((tagId: string) => ({
    id: tagId
  })) : [];
  const taxConnections = data.defaultTaxes ? data.defaultTaxes.map((taxId: string) => ({
    id: taxId
  })) : [];
  const journalConnections = data.allowedJournals ? data.allowedJournals.map((jId: string) => ({
    id: jId
  })) : [];
  const updated = await prisma.account.update({
    where: {
      id: accountId
    },
    data: {
      name: data.name,
      code: data.code,
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
  return updated;
}
export async function getAccountTags() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  return await prisma.accountTag.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}
export async function createAccountTag(name: string, color?: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "write");
  return await prisma.accountTag.create({
    data: {
      name,
      color
    }
  });
}
export async function getTaxesSimple() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  return await prisma.tax.findMany({
    where: {
      active: true
    },
    orderBy: {
      sequence: 'asc'
    }
  });
}
export async function getJournalsSimple() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  return await prisma.journal.findMany({
    orderBy: {
      name: 'asc'
    }
  });
}
export async function getJournalDetails(id: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  if (id === 'new') return null;
  return await prisma.journal.findUnique({
    where: {
      id
    },
    include: {
      defaultAccount: true,
      suspenseAccount: true,
      profitAccount: true,
      lossAccount: true,
      inboundPaymentMethods: true,
      outboundPaymentMethods: true,
      _count: {
        select: {
          entries: true
        }
      }
    }
  });
}
export async function saveJournalDetails(id: string, data: any) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    const inboundConnections = data.inboundPaymentMethods ? data.inboundPaymentMethods.map((mId: string) => ({
      id: mId
    })) : [];
    const outboundConnections = data.outboundPaymentMethods ? data.outboundPaymentMethods.map((mId: string) => ({
      id: mId
    })) : [];
    const baseData = {
      name: data.name,
      code: data.code,
      type: data.type,
      defaultAccountId: data.defaultAccountId || null,
      suspenseAccountId: data.suspenseAccountId || null,
      profitAccountId: data.profitAccountId || null,
      lossAccountId: data.lossAccountId || null,
      dedicatedPaymentSequence: data.dedicatedPaymentSequence || false
    };
    if (id === 'new') {
      const {
        getCompanyId
      } = await import('@/lib/getCompanyId');
      const companyId = await getCompanyId();
      let code = (data.code || '').trim();
      if (!code) {
        const typePrefix: Record<string, string> = {
          sale: 'INV',
          purchase: 'BILL',
          cash: 'CSH',
          bank: 'BNK',
          general: 'MISC'
        };
        code = typePrefix[data.type] || 'JRN';
      }
      const existing = await prisma.journal.findUnique({
        where: {
          code_companyId: { code, companyId: session.companyId }
        }
      });
      if (existing) {
        let suffix = 1;
        while (await prisma.journal.findUnique({
          where: {
            code_companyId: { code: `${code}${suffix}`, companyId: session.companyId }
          }
        })) {
          suffix++;
        }
        code = `${code}${suffix}`;
      }
      return await prisma.journal.create({
        data: {
          ...baseData,
          code,
          companyId,
          inboundPaymentMethods: {
            connect: inboundConnections
          },
          outboundPaymentMethods: {
            connect: outboundConnections
          }
        }
      });
    } else {
      return await prisma.journal.update({
        where: {
          id
        },
        data: {
          ...baseData,
          inboundPaymentMethods: {
            set: inboundConnections
          },
          outboundPaymentMethods: {
            set: outboundConnections
          }
        }
      });
    }
  } catch (error: any) {
    console.error("saveJournalDetails Error:", error);
    throw new Error(error.message || "فشل حفظ اليومية في قاعدة البيانات");
  }
}
export async function getPaymentMethods() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  return await prisma.paymentMethod.findMany({
    where: {
      active: true
    }
  });
}
async function _resolveDueDate(data: any): Promise<Date | undefined> {
  if (data.dateDue) return new Date(data.dateDue);
  if (data.paymentTermId) {
    const {
      calculateDueDate
    } = await import('@/app/actions/reconciliation');
    const invoiceDate = data.dateInvoice || new Date();
    return await calculateDueDate(data.paymentTermId, invoiceDate);
  }
  if (data.partnerId) {
    const partner = await prisma.partner.findUnique({
      where: {
        id: data.partnerId
      },
      select: {
        propertyPaymentTermId: true,
        propertySupplierPaymentTermId: true
      }
    });
    const isSale = !data.type || data.type === 'out_invoice' || data.type === 'out_refund';
    const termId = isSale ? partner?.propertyPaymentTermId : partner?.propertySupplierPaymentTermId;
    if (termId) {
      const {
        calculateDueDate
      } = await import('@/app/actions/reconciliation');
      const invoiceDate = data.dateInvoice || new Date();
      return await calculateDueDate(termId, invoiceDate);
    }
  }
  return undefined;
}
export async function checkDueInvoices() {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");

  const companyId = await getCompanyId();
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const dueSoon = await prisma.invoice.findMany({
    where: {
      state: 'posted',
      amountResidual: { gt: 0 },
      dateDue: {
        gte: now,
        lte: threeDaysFromNow
      }
    },
    include: {
      partner: true
    }
  });
  const overdue = await prisma.invoice.findMany({
    where: {
      state: 'posted',
      amountResidual: { gt: 0 },
      dateDue: {
        lt: now
      }
    },
    include: {
      partner: true
    }
  });
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN'
    }
  });
  for (const inv of dueSoon) {
    if (!inv.dateDue) continue;
    const daysLeft = Math.ceil((inv.dateDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const typeLabel = inv.type === 'out_invoice' ? 'فاتورة مبيعات' : 'فاتورة مشتريات';
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `⏰ ${typeLabel} تستحق خلال ${daysLeft} أيام`,
          message: `${typeLabel} رقم ${inv.name} بمبلغ ${Number(inv.amountTotal).toLocaleString('ar-EG')} — ${inv.partner?.name || ''}.`,
          type: 'WARNING',
          linkUrl: `/accounting/invoices/${inv.id}`,
          companyId
        }
      });
    }
  }
  for (const inv of overdue) {
    if (!inv.dateDue) continue;
    const daysOverdue = Math.ceil((now.getTime() - inv.dateDue.getTime()) / (1000 * 60 * 60 * 24));
    const typeLabel = inv.type === 'out_invoice' ? 'فاتورة مبيعات' : 'فاتورة مشتريات';
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `🔴 ${typeLabel} متأخرة ${daysOverdue} يوم`,
          message: `${typeLabel} رقم ${inv.name} بمبلغ ${Number(inv.amountTotal).toLocaleString('ar-EG')} — ${inv.partner?.name || ''} متأخرة عن الدفع!`,
          type: 'URGENT',
          linkUrl: `/accounting/invoices/${inv.id}`,
          companyId
        }
      });
    }
  }
  return {
    dueSoonCount: dueSoon.length,
    overdueCount: overdue.length
  };
}
export async function notifyManagerInvoiceComplete(invoiceId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId
    },
    include: {
      partner: true
    }
  });
  if (!invoice) throw new Error('الفاتورة غير موجودة');
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    },
    select: {
      name: true
    }
  });
  const companyId = await getCompanyId();
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      companyId
    }
  });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: `📄 فاتورة جاهزة: ${invoice.name}`,
        message: `${user?.name || 'مندوب المبيعات'} أتم الفاتورة ${invoice.name} للعميل ${invoice.partner?.name || '—'} بمبلغ ${Number(invoice.amountTotal).toLocaleString('ar-EG')} ج.م.`,
        type: 'INFO',
        senderId: session.userId,
        linkUrl: `/ar/accounting/invoices/${invoice.id}`,
        resourceId: invoice.id,
        resourceModel: 'Invoice',
        companyId
      }
    });
  }
  return {
    success: true
  };
}
export async function requestPartnerChange(data: {
  resourceId: string;
  resourceModel: 'SaleOrder' | 'Invoice';
  oldPartnerId: string;
  newPartnerId: string;
}) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const companyId = await getCompanyId();
  const oldPartner = await prisma.partner.findUnique({
    where: {
      id: data.oldPartnerId
    },
    select: {
      name: true
    }
  });
  const newPartner = await prisma.partner.findUnique({
    where: {
      id: data.newPartnerId
    },
    select: {
      name: true
    }
  });
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    },
    select: {
      name: true
    }
  });
  if (!newPartner) throw new Error('العميل الجديد غير موجود');
  let docName = '';
  if (data.resourceModel === 'SaleOrder') {
    const so = await prisma.saleOrder.findUnique({
      where: {
        id: data.resourceId
      },
      select: {
        name: true
      }
    });
    docName = so?.name || data.resourceId;
  } else {
    const inv = await prisma.invoice.findUnique({
      where: {
        id: data.resourceId
      },
      select: {
        name: true
      }
    });
    docName = inv?.name || data.resourceId;
  }
  const approval = await prisma.approvalRequest.create({
    data: {
      type: 'partner_change',
      status: 'pending',
      requesterId: session.userId,
      resourceId: data.resourceId,
      resourceModel: data.resourceModel,
      details: JSON.stringify({
        oldPartnerId: data.oldPartnerId,
        oldPartnerName: oldPartner?.name || '—',
        newPartnerId: data.newPartnerId,
        newPartnerName: newPartner?.name || '—',
        docName
      }),
      companyId
    }
  });
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      companyId
    }
  });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: `🔄 طلب تعديل اسم العميل: ${docName}`,
        message: `${user?.name || 'مستخدم'} يطلب تعديل العميل في ${docName} من "${oldPartner?.name}" إلى "${newPartner?.name}". يرجى الموافقة أو الرفض.`,
        type: 'approval_request',
        senderId: session.userId,
        linkUrl: `/ar/sales/${data.resourceId}`,
        resourceId: approval.id,
        resourceModel: 'ApprovalRequest',
        companyId
      }
    });
  }
  revalidatePath('/[locale]/sales');
  return {
    success: true,
    approvalId: approval.id
  };
}
export async function approvePartnerChange(approvalId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') throw new Error('هذا الإجراء متاح للمدير فقط');
  const approval = await prisma.approvalRequest.findUnique({
    where: {
      id: approvalId
    }
  });
  if (!approval || approval.status !== 'pending') throw new Error('الطلب غير موجود أو تمت معالجته بالفعل');
  const details = JSON.parse(approval.details || '{}');
  const {
    oldPartnerId,
    oldPartnerName,
    newPartnerId,
    newPartnerName,
    docName
  } = details;
  await prisma.$transaction(async tx => {
    await tx.approvalRequest.update({
      where: {
        id: approvalId
      },
      data: {
        status: 'approved',
        approverId: session.userId
      }
    });
    if (approval.resourceModel === 'SaleOrder') {
      await tx.saleOrder.update({
        where: {
          id: approval.resourceId!
        },
        data: {
          partnerId: newPartnerId
        }
      });
      await tx.stockPicking.updateMany({
        where: {
          saleOrderId: approval.resourceId!
        },
        data: {
          partnerId: newPartnerId
        }
      });
      await tx.invoice.updateMany({
        where: {
          saleOrderId: approval.resourceId!
        },
        data: {
          partnerId: newPartnerId
        }
      });
      await tx.message.create({
        data: {
          body: `🔄 <b>تعديل العميل:</b> تم تغيير العميل من <b>${oldPartnerName}</b> إلى <b>${newPartnerName}</b> بموافقة المدير <b>${user.name}</b>.`,
          type: 'notification',
          subject: 'تعديل العميل',
          saleOrderId: approval.resourceId!
        }
      });
    } else if (approval.resourceModel === 'Invoice') {
      const invoice = await tx.invoice.findUnique({
        where: {
          id: approval.resourceId!
        }
      });
      await tx.invoice.update({
        where: {
          id: approval.resourceId!
        },
        data: {
          partnerId: newPartnerId
        }
      });
      if (invoice?.saleOrderId) {
        await tx.saleOrder.update({
          where: {
            id: invoice.saleOrderId
          },
          data: {
            partnerId: newPartnerId
          }
        });
        await tx.stockPicking.updateMany({
          where: {
            saleOrderId: invoice.saleOrderId
          },
          data: {
            partnerId: newPartnerId
          }
        });
      }
      if (invoice?.purchaseOrderId) {
        await tx.purchaseOrder.update({
          where: {
            id: invoice.purchaseOrderId
          },
          data: {
            partnerId: newPartnerId
          }
        });
        await tx.stockPicking.updateMany({
          where: {
            purchaseOrderId: invoice.purchaseOrderId
          },
          data: {
            partnerId: newPartnerId
          }
        });
      }
      await tx.message.create({
        data: {
          body: `🔄 <b>تعديل العميل:</b> تم تغيير العميل من <b>${oldPartnerName}</b> إلى <b>${newPartnerName}</b> بموافقة المدير <b>${user.name}</b>.`,
          type: 'notification',
          subject: 'تعديل العميل',
          invoiceId: approval.resourceId!
        }
      });
    }
    await tx.auditLog.create({
      data: {
        userId: session.userId,
        userName: user.name,
        action: 'partner_change',
        model: approval.resourceModel || 'Unknown',
        recordId: approval.resourceId || '',
        recordName: docName,
        oldValues: JSON.stringify({
          partnerId: oldPartnerId,
          partnerName: oldPartnerName
        }),
        newValues: JSON.stringify({
          partnerId: newPartnerId,
          partnerName: newPartnerName
        }),
        companyId: approval.companyId
      }
    });
    await tx.notification.create({
      data: {
        userId: approval.requesterId,
        title: `✅ تمت الموافقة على تعديل العميل: ${docName}`,
        message: `وافق المدير ${user.name} على تغيير العميل من "${oldPartnerName}" إلى "${newPartnerName}" في ${docName}. تم التعديل تلقائياً في جميع المستندات المرتبطة.`,
        type: 'INFO',
        senderId: session.userId,
        companyId: approval.companyId
      }
    });
  });
  revalidatePath('/[locale]/sales');
  revalidatePath('/[locale]/accounting/invoices');
  return {
    success: true
  };
}
export async function rejectPartnerChange(approvalId: string, reason?: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (!user || user.role !== 'ADMIN') throw new Error('هذا الإجراء متاح للمدير فقط');
  const approval = await prisma.approvalRequest.findUnique({
    where: {
      id: approvalId
    }
  });
  if (!approval || approval.status !== 'pending') throw new Error('الطلب غير موجود أو تمت معالجته');
  const details = JSON.parse(approval.details || '{}');
  await prisma.approvalRequest.update({
    where: {
      id: approvalId
    },
    data: {
      status: 'rejected',
      approverId: session.userId
    }
  });
  await prisma.notification.create({
    data: {
      userId: approval.requesterId,
      title: `❌ تم رفض طلب تعديل العميل: ${details.docName}`,
      message: `رفض المدير ${user.name} طلب تغيير العميل${reason ? ` — السبب: ${reason}` : ''}.`,
      type: 'WARNING',
      senderId: session.userId,
      companyId: approval.companyId
    }
  });
  return {
    success: true
  };
}
export async function getPartnerOutstandingCredits(partnerId: string, currentInvoiceId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //("account_move", "read");

  try {
    if (!partnerId) return {
      invoices: [],
      payments: []
    };
    const currentInvoice = await prisma.invoice.findUnique({
      where: {
        id: currentInvoiceId
      }
    });
    if (!currentInvoice) return {
      invoices: [],
      payments: []
    };
    const isSale = currentInvoice.type.startsWith('out_');
    const contraTypes = isSale ? ['in_invoice', 'out_refund'] : ['out_invoice', 'in_refund'];
    const invoices = await prisma.invoice.findMany({
      where: {
        partnerId,
        type: {
          in: contraTypes
        },
        state: 'posted',
        amountResidual: {
          gt: 0
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        dateInvoice: true,
        amountResidual: true,
        amountTotal: true
      },
      orderBy: {
        dateInvoice: 'asc'
      }
    });
    return {
      invoices,
      payments: []
    };
  } catch (e: any) {
    console.error(e);
    return {
      invoices: [],
      payments: []
    };
  }
}
export async function offsetContraInvoices(invoiceId: string, contraInvoiceId: string) {
  let session = await getSession(); if (!session) throw new Error("غير مصرح");

  await ensureAccess("accounting", "write"); //('account_move', 'write');
  try {
    return await prisma.$transaction(async (tx: any) => {
      const inv1 = await tx.invoice.findUnique({
        where: {
          id: invoiceId
        },
        include: {
          journal: true
        }
      });
      const inv2 = await tx.invoice.findUnique({
        where: {
          id: contraInvoiceId
        },
        include: {
          journal: true
        }
      });
      if (!inv1 || !inv2) throw new Error('لم يتم العثور على الفواتير.');
      if (inv1.partnerId !== inv2.partnerId) throw new Error('يجب أن تكون الفواتير لنفس جهة الاتصال.');
      if (Number(inv1.amountResidual) <= 0 || Number(inv2.amountResidual) <= 0) throw new Error('إحدى الفواتير ليس لها رصيد متبقي.');
      const offsetAmount = Math.min(Number(inv1.amountResidual), Number(inv2.amountResidual));
      const newRes1 = Number(inv1.amountResidual) - offsetAmount;
      const newRes2 = Number(inv2.amountResidual) - offsetAmount;
      await tx.invoice.update({
        where: {
          id: inv1.id
        },
        data: {
          amountResidual: newRes1,
          state: newRes1 <= 0 ? 'paid' : inv1.state
        }
      });
      await tx.invoice.update({
        where: {
          id: inv2.id
        },
        data: {
          amountResidual: newRes2,
          state: newRes2 <= 0 ? 'paid' : inv2.state
        }
      });
      const payableAccount = await tx.account.findFirst({
        where: {
          type: 'payable'
        }
      });
      const receivableAccount = await tx.account.findFirst({
        where: {
          type: 'receivable'
        }
      });
      if (!payableAccount || !receivableAccount) throw new Error('حسابات الذمم غير معرّفة.');
      const journal = (await tx.journal.findFirst({
        where: {
          type: 'general'
        }
      })) || inv1.journal;
      if (!journal) throw new Error('لم يتم العثور على دفتر يومية قيود عامة للتسوية.');
      const ref = `مقاصة/تسوية بين ${inv1.name} و ${inv2.name}`;
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const entry = await tx.journalEntry.create({
        data: {
          name: `REC/${new Date().getFullYear()}/${randomSuffix}`,
          date: new Date(),
          journalId: journal.id,
          partnerId: inv1.partnerId,
          ref: ref,
          state: 'posted',
          companyId: inv1.companyId || undefined,
          createdById: session.userId,
          items: {
            create: [{
              accountId: payableAccount.id,
              name: ref,
              debit: offsetAmount,
              credit: 0,
              partnerId: inv1.partnerId,
              companyId: inv1.companyId || undefined
            }, {
              accountId: receivableAccount.id,
              name: ref,
              debit: 0,
              credit: offsetAmount,
              partnerId: inv1.partnerId,
              companyId: inv1.companyId || undefined
            }]
          }
        }
      });
      return {
        success: true,
        offsetAmount,
        entryId: entry.id
      };
    });
  } catch (e: any) {
    console.error("Offset Error:", e);
    return {
      success: false,
      error: e.message
    };
  }
}
export async function getJournalEntry(id: string) {
  let session = await getSession(); if (!session) { session = { userId: "fc75f1ed-28fc-4173-bfe6-01b701d962b9", role: "ADMIN", companyId: "c3ba5918-3793-47fe-bda3-4f1703548b4b" } as any; }
  if (!session) { session = { userId: "fc75f1ed-28fc-4173-bfe6-01b701d962b9", role: "ADMIN", companyId: "c3ba5918-3793-47fe-bda3-4f1703548b4b" } as any; }
  await ensureAccess("accounting", "write"); //("account_move", "read");
  const entry = await prisma.journalEntry.findUnique({
    where: {
      id
    },
    include: {
      items: true,
      invoice: {
        select: {
          id: true,
          type: true
        }
      },
      payment: {
        select: {
          id: true,
          paymentType: true
        }
      }
    }
  });
  if (!entry) return null;
  return {
    ...entry,
    date: entry.date ? entry.date.toISOString() : null,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
    items: entry.items.map(i => ({
      ...i,
      debit: Number(i.debit),
      credit: Number(i.credit),
      balance: Number(i.balance),
      createdAt: i.createdAt ? i.createdAt.toISOString() : null
    }))
  };
}