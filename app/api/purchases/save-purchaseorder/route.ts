import { NextRequest, NextResponse } from "next/server";
import { updatePurchaseOrder } from "@/app/actions/purchases";
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const id = payload.id;
    if (!id) {
      return NextResponse.json({
        error: "Missing id"
      }, {
        status: 400
      });
    }
    /* Just use the existing server action logic, which handles all formatting and relations */
    const result = await updatePurchaseOrder(id, {
      ...payload,
      partnerId: payload.vendor
    });
    if ((result as any)?.error) {
      return NextResponse.json({
        error: (result as any).error
      }, {
        status: 400
      });
    }
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error("[API save-purchaseorder] Error:", error);
    return NextResponse.json({
      error: error.message || "Save failed"
    }, {
      status: 500
    });
  }
}