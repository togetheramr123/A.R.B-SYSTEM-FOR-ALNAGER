import { NextResponse } from "next/server";
import { checkAndReleaseExpiredReservations } from "@/app/actions/sales";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
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