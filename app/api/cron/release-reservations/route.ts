import { NextResponse } from "next/server";
import { checkAndReleaseExpiredReservations } from "@/app/actions/sales";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkAndReleaseExpiredReservations();
    return NextResponse.json({
      success: true,
      message: `Released ${result.count} expired reservations.`
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, {
      status: 500
    });
  }
}