import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { safeDecimal } from "@/lib/utils/numberUtils"; /** * POST /api/inventory/save-product * * A keepalive-safe API route for auto-saving product data. * Unlike Server Actions, fetch requests to API routes with `keepalive: true` * are NOT aborted when the page navigates away, ensuring data persistence. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        error: "Unauthorized"
      }, {
        status: 401
      });
    }
    const {
      id,
      data
    } = await req.json();
    if (!id || !data?.name || data.name.trim() === "") {
      return NextResponse.json({
        error: "Missing id or name"
      }, {
        status: 400
      });
    }
    /* Security: verify the product belongs to this session's company */
    const existing = await prisma.product.findFirst({
      where: {
        id,
        companyId: session.companyId
      }
    });
    if (!existing) {
      return NextResponse.json({
        error: "Not found or access denied"
      }, {
        status: 404
      });
    }
    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name: data.name,
        image: data.image,
        description: data.description || null,
        type: data.detailedType || "consu",
        canBeSold: data.can_sell ?? true,
        canBePurchased: data.can_purchase ?? true,
        invoicingPolicy: data.invoicingPolicy || "ordered",
        uom: data.uom,
        purchaseUom: data.purchaseUom,
        hasSecondaryUnit: data.hasSecondaryUnit,
        secondaryUom: data.secondaryUom,
        secondaryUomFactor: safeDecimal(data.secondaryUomFactor, 1.0) as any,
        salePrice: safeDecimal(data.salePrice) as any,
        costPrice: safeDecimal(data.costPrice) as any,
        taxes: safeDecimal(data.taxes) as any,
        internalReference: data.internalReference || null,
        barcode: data.barcode && data.barcode.trim() !== "" ? data.barcode.trim() : null,
        categoryId: data.categoryId && data.categoryId !== "All" && data.categoryId !== "all" ? data.categoryId : null,
        detailedType: data.detailedType,
        descriptionSale: data.descriptionSale,
        routeBuy: data.routeBuy === "on" || data.routeBuy === true,
        routeMto: data.routeMto === "on" || data.routeMto === true,
        weight: safeDecimal(data.weight) as any,
        volume: safeDecimal(data.volume) as any,
        descriptionPicking: data.descriptionPicking || null,
        descriptionPickingout: data.descriptionPickingout || null,
        availableInPos: data.availableInPos ?? false,
        websitePublished: data.websitePublished ?? false,
        controlPolicy: data.controlPolicy || "ordered",
        descriptionPurchase: data.descriptionPurchase || null,
        propertyAccountIncomeId: data.propertyAccountIncomeId || null,
        propertyAccountExpenseId: data.propertyAccountExpenseId || null,
        assetType: data.assetType || null,
        priceDifferenceAccount: data.priceDifferenceAccount || null
      }
    });
    return NextResponse.json({
      success: true,
      id: product.id
    });
  } catch (error: any) {
    console.error("[API save-product] Error:", error);
    return NextResponse.json({
      error: error.message || "Save failed"
    }, {
      status: 500
    });
  }
}