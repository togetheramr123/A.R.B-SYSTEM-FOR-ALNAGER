import { NextResponse } from "next/server";
import { checkDueCheques } from "@/app/actions/cheques";
export const dynamic = "force-dynamic";
/* To secure this endpoint, you could check for an Authorization header or a custom secret */
export async function GET(request: Request) {
  try {
    /* Optional: Check cron secret */const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", {
        status: 401
      });
    }
    const result = await checkDueCheques();
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error("Cron checkDueCheques error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500
    });
  }
}