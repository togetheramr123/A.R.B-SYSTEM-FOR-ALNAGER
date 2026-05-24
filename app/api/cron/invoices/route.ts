import { NextResponse } from "next/server";
import { checkDueInvoices } from "@/app/actions/accounting";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkDueInvoices();
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error("Cron checkDueInvoices error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500
    });
  }
}