import { NextResponse } from "next/server";
import { checkDueCheques } from "@/app/actions/cheques";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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