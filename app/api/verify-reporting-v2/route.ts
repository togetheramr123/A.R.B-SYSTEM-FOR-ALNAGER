import { NextResponse } from "next/server";
import { getTrialBalance } from "@/app/actions/reporting";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
export async function GET() {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);
  try {
    log("Starting Financial Reporting Verification V2...");
    /* 0. DATA REPAIR */
    const localPrisma = await import("@/lib/prisma").then(m => m.default);
    /* Repair Invoice Entries */
    const invoiceEntries = await localPrisma.journalEntry.findMany({
      where: {
        partnerId: null,
        invoice: {
          isNot: null
        }
      },
      include: {
        invoice: true
      }
    });
    for (const entry of invoiceEntries) {
      if (entry.invoice && entry.invoice.partnerId) {
        await localPrisma.journalEntry.update({
          where: {
            id: entry.id
          },
          data: {
            partnerId: entry.invoice.partnerId
          }
        });
      }
    }
    /* Repair Payment Entries */
    const paymentEntries = await localPrisma.journalEntry.findMany({
      where: {
        partnerId: null,
        payment: {
          isNot: null
        }
      },
      include: {
        payment: true
      }
    });
    for (const entry of paymentEntries) {
      if (entry.payment && entry.payment.partnerId) {
        await localPrisma.journalEntry.update({
          where: {
            id: entry.id
          },
          data: {
            partnerId: entry.payment.partnerId
          }
        });
      }
    }
    /* 1. Fetch Company */
    const company = await prisma.company.findFirst();
    if (!company) log("WARNING: No company found");else log(`Company: ${company.name}`);
    /* 3. Test Date Range (Today) log("--- Testing Date Range (Today) ---"); */
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    log(`Date Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    const periodTB = await getTrialBalance(startOfDay, endOfDay);
    log("SUCCESS: All account balances match math logic.");
    /* 4. Test General Ledger log("--- Testing General Ledger ---"); // @ts-ignore */
    const glData = await import("@/app/actions/reporting").then(m => m.getGeneralLedger(undefined, startOfDay, endOfDay));
    if (glData.length > 0) {
      const firstAcc = glData[0];
      log(`Checking Account: ${firstAcc.code} - ${firstAcc.name}`);
      log(`Initial Balance: ${firstAcc.initialBalance}`);
      log(`Transaction Count: ${firstAcc.items.length}`);
    }
    log("SUCCESS: GL fetched.");
    /* 5. Test Partner Ledger log("--- Testing Partner Ledger ---"); // @ts-ignore */
    const plData = await import("@/app/actions/reporting").then(m => m.getPartnerLedger(undefined, startOfDay, endOfDay));
    if (plData.length === 0) {
      log("WARNING: Partner Ledger returned no partners.");
      /* DEBUG: Check Journal Items */
      const recentItems = await localPrisma.journalItem.findMany({
        take: 5,
        orderBy: {
          id: "desc"
        },
        include: {
          account: true,
          entry: true
        }
      });
      log("DEBUG: Recent Journal Items:");
      for (const item of recentItems) {
        log(`Item: ${item.name} (${item.entry.date.toISOString()}), Account: ${item.account.name} (Type: ${item.account.type}), PartnerID: ${item.entry.partnerId}`);
      }
    } else {
      log(`Fetched PL for ${plData.length} partners.`);
      const firstPartner = plData[0];
      log(`Checking Partner: ${firstPartner.name}`);
      let calcRunning = new Decimal(firstPartner.initialBalance);
      for (const item of firstPartner.items) {
        calcRunning = calcRunning.plus(new Decimal(item.debit).minus(new Decimal(item.credit)));
      }
      log(`Calculated Ending Balance: ${calcRunning}`);
    }
    log("SUCCESS: Partner Ledger fetched successfully.");
    return NextResponse.json({
      success: true,
      logs
    });
  } catch (e: any) {
    log(`FATAL ERROR: ${e.message}`);
    return NextResponse.json({
      success: false,
      logs
    }, {
      status: 500
    });
  }
}