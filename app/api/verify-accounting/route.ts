import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { generateStockMoveEntryV2, confirmInvoice, registerPayment } from '@/app/actions/accounting';
export async function GET() {
  try {
    console.log("Starting Full Cycle Verification...");
    const results = [];
    const TEST_COMPANY_ID = 'test-company-verify-123';
    const TEST_PARTNER_ID = 'test-vendor-verify-123';
    let company;
    try {
      company = await prisma.company.upsert({
        where: {
          id: TEST_COMPANY_ID
        },
        update: {},
        create: {
          id: TEST_COMPANY_ID,
          name: 'Test Company Verify',
          currency: 'EGP'
        }
      });
    } catch (e) {
      company = (await prisma.company.findFirst()) || (await prisma.company.create({
        data: {
          name: 'Fallback Company'
        }
      }));
    }
    const companyId = company.id;
    results.push(`Company: ${company.name} (${companyId})`);
    let partner;
    try {
      partner = await prisma.partner.upsert({
        where: {
          id: TEST_PARTNER_ID
        },
        update: {},
        create: {
          id: TEST_PARTNER_ID,
          name: 'Test Vendor Verify',
          email: 'verify@test.com',
          isVendor: true,
          companyId: companyId
        }
      });
    } catch (e) {
      partner = (await prisma.partner.findFirst()) || (await prisma.partner.create({
        data: {
          name: 'Fallback Vendor',
          isVendor: true
        }
      }));
    }
    results.push(`Partner: ${partner.name} (${partner.id})`);
    ;
    const stockAsset = await prisma.account.findFirst({
      where: {
        code: '101000'
      }
    });
    const stockInput = await prisma.account.findFirst({
      where: {
        code: '101100'
      }
    });
    const expense = await prisma.account.findFirst({
      where: {
        code: '600000'
      }
    });
    let category = await prisma.productCategory.findFirst({
      where: {
        name: 'Test Category Verify'
      }
    });
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: 'Test Category Verify',
          costingMethod: 'avco',
          valuation: 'real_time',
          propertyStockAccountId: stockAsset?.id,
          propertyStockAccountInputId: stockInput?.id,
          propertyAccountExpenseId: expense?.id
        }
      });
    }
    results.push(`Category: ${category.name} (Valuation: Real Time)`);
    const product = await prisma.product.create({
      data: {
        name: `Test Product ${Date.now()}`,
        type: 'product',
        categoryId: category.id,
        costPrice: new Decimal(100),
        salePrice: new Decimal(200)
      }
    });
    results.push(`Product: ${product.name} (${product.id})`);
    let po: any = null;
    try {
      po = await prisma.purchaseOrder.create({
        data: {
          name: `PO-VERIFY-${Date.now()}`,
          partnerId: partner.id,
          status: 'purchase',
          companyId: companyId,
          amountTotal: new Decimal(1000)
        }
      });
    } catch (e: any) {
      results.push(`ERROR PO: ${e.message}`);
      throw e;
    }
    results.push(`PO Created: ${po.name}`);
    const sourceLoc = await prisma.location.findFirst({ where: { type: 'supplier' } });
    const destLoc = await prisma.location.findFirst({ where: { type: 'internal' } });
    if (!sourceLoc || !destLoc) throw new Error("Locations missing");
    const picking = await prisma.stockPicking.create({
      data: {
        name: `WH/IN/VERIFY-${Date.now()}`,
        pickingType: 'incoming',
        locationId: sourceLoc.id,
        locationDestId: destLoc.id,
        partnerId: partner.id,
        status: 'done',
        purchaseOrderId: po.id,
        companyId: companyId
      }
    });
    const move = await prisma.stockMove.create({
      data: {
        name: product.name,
        productId: product.id,
        pickingId: picking.id,
        sourceLocationId: sourceLoc.id,
        destLocationId: destLoc.id,
        quantity: new Decimal(10),
        quantityDone: new Decimal(10),
        status: 'done',
        priceNet: new Decimal(100),
        companyId: companyId
      },
      include: { product: { include: { category: true } } }
    });
    await generateStockMoveEntryV2(move.id);
    const stockEntry = await prisma.journalEntry.findFirst({
      where: { name: { startsWith: picking.name } },
      include: { items: true }
    });
    if (stockEntry) {
      results.push(`Stock Entry Created: ${stockEntry.name} (Items: ${stockEntry.items.length})`);
    } else {
      results.push(`ERROR: Stock Entry NOT Created!`);
    }
    
    const invoice = await prisma.invoice.create({
      data: {
        name: `BILL/VERIFY/${Date.now()}`,
        companyId: companyId,
        partnerId: partner.id,
        state: 'draft',
        type: 'in_invoice',
        dateInvoice: new Date(),
        invoiceOrigin: po.name,
        purchaseOrderId: po.id,
        amountUntaxed: 1000,
        amountTax: 0,
        amountTotal: 1000,
        lines: {
          create: [{
            productId: product.id,
            name: product.name,
            quantity: new Decimal(10),
            priceUnit: new Decimal(100),
            priceSubtotal: new Decimal(1000),
            accountId: stockInput?.id
          }]
        }
      }
    });
    results.push(`Bill Created: ${invoice.name}`);
    await confirmInvoice(invoice.id);
    const billEntry = await prisma.journalEntry.findFirst({ where: { ref: invoice.name } });
    if (billEntry) results.push(`Bill Entry Created: ${billEntry.name}`);

    const bankJournal = await prisma.journal.findFirst({ where: { type: 'bank' } });
    await registerPayment(invoice.id, 1000, bankJournal?.id);
    
    const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    results.push(`Invoice Status after Payment: ${updatedInvoice?.state}`);

    const payEntry = await prisma.journalEntry.findFirst({
        where: { ref: `Payment for ${invoice.name}` },
        include: { items: true }
    });

    if (payEntry) {
      results.push(`Payment Entry Created: ${payEntry.name}`);
    } else {
      results.push(`ERROR: Payment Entry NOT Created!`);
    }
    return NextResponse.json({
      success: true,
      logs: results
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message,
      stack: e.stack
    });
  }
}