'use server';

import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export type PartnerImportData = {
  name: string;
  phone: string;
  email: string;
  type: string; // 'customer' or 'vendor'
  balance2025: number;
  invoices: {
    number: string;
    date: Date;
    total: number;
  }[];
  payments: {
    memo: string;
    date: Date;
    amount: number;
  }[];
};

export async function importPartnersData(partners: PartnerImportData[]) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("partner", "create");

  const companyId = session.companyId;
  const userId = session.userId;

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Get/Create default accounts for Partners (Receivable / Payable)
      const accounts = await tx.account.findMany({
        where: { companyId, code: { in: ['10101', '20101', '400001', '500001'] } } // 10101: Receivable, 20101: Payable, 400001/500001: Revenue/Expense
      });
      const getAcct = (code: string) => accounts.find(a => a.code === code)?.id;
      
      let receivableId = getAcct('10101');
      if (!receivableId) {
        const acc = await tx.account.create({ data: { code: '10101', name: 'العملاء (أرصدة افتتاحية مستوردة)', type: 'asset', companyId }});
        receivableId = acc.id;
      }

      let payableId = getAcct('20101');
      if (!payableId) {
        const acc = await tx.account.create({ data: { code: '20101', name: 'الموردين (أرصدة افتتاحية مستوردة)', type: 'liability', companyId }});
        payableId = acc.id;
      }

      // 2. Get/Create Sales/Purchase Journals
      let saleJournal = await tx.journal.findFirst({ where: { companyId, type: 'sale' } });
      if (!saleJournal) {
        saleJournal = await tx.journal.create({ data: { code: 'INV', name: 'مبيعات (تاريخي)', type: 'sale', companyId }});
      }

      let purchaseJournal = await tx.journal.findFirst({ where: { companyId, type: 'purchase' } });
      if (!purchaseJournal) {
        purchaseJournal = await tx.journal.create({ data: { code: 'BILL', name: 'مشتريات (تاريخي)', type: 'purchase', companyId }});
      }

      let bankJournal = await tx.journal.findFirst({ where: { companyId, type: { in: ['bank', 'cash'] } } });
      if (!bankJournal) {
        bankJournal = await tx.journal.create({ data: { code: 'CSH', name: 'خزينة (تاريخي)', type: 'cash', companyId }});
      }

      const importedPartners = [];
      let totalInvoicesCreated = 0;
      let totalPaymentsCreated = 0;

      for (const row of partners) {
        if (!row.name || row.name.trim() === '') continue;
        
        const isCustomer = row.type !== 'vendor';
        const isVendor = row.type === 'vendor';

        // 3. Find or Create Partner
        let partner = await tx.partner.findFirst({
          where: { name: row.name.trim(), companyId }
        });

        if (!partner) {
          partner = await tx.partner.create({
            data: {
              name: row.name.trim(),
              phone: row.phone || null,
              email: row.email || null,
              isCustomer,
              isVendor,
              companyId,
              propertyAccountReceivableId: receivableId,
              propertyAccountPayableId: payableId
            }
          });
        } else {
          // Update flags if needed
          await tx.partner.update({
            where: { id: partner.id },
            data: {
              isCustomer: partner.isCustomer || isCustomer,
              isVendor: partner.isVendor || isVendor,
              phone: partner.phone || row.phone || null
            }
          });
        }
        
        importedPartners.push(partner);

        // 4. Create Opening Balance 2025 Invoice
        if (row.balance2025 > 0) {
          const invType = isCustomer ? 'out_invoice' : 'in_invoice';
          const journalId = isCustomer ? saleJournal.id : purchaseJournal.id;

          const invoice = await tx.invoice.create({
            data: {
              name: `OB-2025-${partner.id.substring(0, 4)}`,
              type: invType,
              partnerId: partner.id,
              dateInvoice: new Date('2025-12-31T12:00:00Z'),
              state: 'posted',
              amountTotal: row.balance2025,
              amountUntaxed: row.balance2025,
              amountResidual: row.balance2025,
              companyId,
              journalId,
              createdById: userId,
              lines: {
                create: {
                  name: 'رصيد افتتاحي مرحل من 2025',
                  quantity: 1,
                  priceUnit: row.balance2025,
                  priceSubtotal: row.balance2025
                }
              }
            }
          });
          
          const entry = await tx.journalEntry.create({
            data: {
              name: invoice.name,
              date: invoice.dateInvoice,
              journalId,
              companyId,
              state: 'posted',
              partnerId: partner.id,
              invoice: { connect: { id: invoice.id } }
            }
          });
          
          totalInvoicesCreated++;
        }

        // 5. Create 2026 Historical Invoices
        for (const invData of row.invoices) {
          if (invData.total <= 0) continue;
          
          const invType = isCustomer ? 'out_invoice' : 'in_invoice';
          const journalId = isCustomer ? saleJournal.id : purchaseJournal.id;

          const invoice = await tx.invoice.create({
            data: {
              name: invData.number || `HIST-INV-${Date.now()}`,
              type: invType,
              partnerId: partner.id,
              dateInvoice: invData.date,
              state: 'posted',
              amountTotal: invData.total,
              amountUntaxed: invData.total,
              amountResidual: invData.total, // Assume unpaid initially
              companyId,
              journalId,
              createdById: userId,
              lines: {
                create: {
                  name: 'استيراد فاتورة تاريخية - 2026',
                  quantity: 1,
                  priceUnit: invData.total,
                  priceSubtotal: invData.total
                }
              }
            }
          });
          
          await tx.journalEntry.create({
            data: {
              name: invoice.name,
              date: invoice.dateInvoice,
              journalId,
              companyId,
              state: 'posted',
              partnerId: partner.id,
              invoice: { connect: { id: invoice.id } }
            }
          });
          
          totalInvoicesCreated++;
        }

        // 6. Create 2026 Historical Payments
        for (const payData of row.payments) {
          if (payData.amount <= 0) continue;

          const paymentType = isCustomer ? 'inbound' : 'outbound';
          const partnerType = isCustomer ? 'customer' : 'vendor';

          const payment = await tx.payment.create({
            data: {
              name: payData.memo || `HIST-PAY-${Date.now()}`,
              paymentType,
              partnerType,
              amount: payData.amount,
              date: payData.date,
              partnerId: partner.id,
              journalId: bankJournal.id,
              state: 'posted',
              companyId,
              createdById: userId,
            }
          });
          
          totalPaymentsCreated++;
        }
      }

      return { success: true, count: importedPartners.length, invoices: totalInvoicesCreated, payments: totalPaymentsCreated };
    }, {
      maxWait: 30000,
      timeout: 180000 // 3 minutes timeout for large imports
    });

    return txResult;
  } catch (e: any) {
    console.error("Import Partners Error:", e);
    return { success: false, error: e.message };
  }
}
