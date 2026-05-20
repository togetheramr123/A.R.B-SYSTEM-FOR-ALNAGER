import { NextResponse } from "next/server";
import { getPartnerLedger } from "@/app/actions/reporting";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
export const dynamic = "force-dynamic";
export async function GET() {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);
  try {
    log("Starting Financial Reporting Verification V3 (Wide Date)...");
    /* Test Partner Ledger with Wide Date log("--- Testing Partner Ledger (All Time) ---"); */
    const from = new Date(0);
    /* 1970 */
    const to = new Date();
    /* Now // @ts-ignore */
    const plData = await getPartnerLedger(undefined, from, to);
    if (plData.length === 0) {
      log("WARNING: Partner Ledger returned no partners.");
      /* DEBUG: Check Journal Items */
      const localPrisma = await import("@/lib/prisma").then(m => m.default);
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
        /* @ts-ignore log(`Item: ${item.name} (${item.entry.date.toISOString()}), Account: ${item.account.name} (Type: ${item.account.type}), PartnerID: ${item.entry.partnerId}`); */
      }
    } else {
      log(`Fetched PL for ${plData.length} partners.`);
      for (const p of plData) {
        /* @ts-ignore log(`Partner: ${p.name}, Balance: ${p.items.reduce((acc: any, i: any) => acc + (i.debit - i.credit), p.initialBalance)}`); */
      }
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