import { NextResponse } from 'next/server';
import { performDailySettlementAll } from '@/app/actions/cash-register';
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({
      error: 'Unauthorized'
    }, {
      status: 401
    });
  }
  try {
    const results = await performDailySettlementAll();
    return NextResponse.json({
      success: true,
      message: `تم ترحيل ${results.length} خزينة`,
      results
    });
  } catch (error: any) {
    console.error('[DailySettlement] Error:', error);
    return NextResponse.json({
      error: error.message
    }, {
      status: 500
    });
  }
}