"use server";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { generateStockMoveEntryV2 as generateStockMoveEntry } from "./accounting";
export async function applyMultipleAdjustments(lines: {
  locationId: string;
  productId: string;
  realQty: number;
}[]) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const moveIds: string[] = [];
    await prisma.$transaction(async tx => {
      for (const line of lines) {
        const realQty = new Decimal(line.realQty);
        const quant = await tx.stockQuant.findFirst({
          where: {
            productId: line.productId,
            locationId: line.locationId,
            lotId: null
          }
        });
        const currentQty = quant ? new Decimal(quant.quantity) : new Decimal(0);
        const diff = realQty.minus(currentQty);
        if (diff.isZero()) continue; // Create Move (Adjustment Virtual Location Concept) // In Odoo, positive adj comes from 'Inventory Adjustment' virtual loc to Internal. // Negative goes from Internal to Virtual.
        const virtualLocation = (await tx.location.findFirst({
          where: {
            type: "inventory"
          }
        })) || (await tx.location.create({
          data: {
            name: "Inventory Adjustment",
            type: "inventory",
            companyId: session.companyId
          }
        }));
        const move = await tx.stockMove.create({
          data: {
            companyId: session.companyId,
            name: `INV-ADJ: ${new Date().toISOString()}`,
            productId: line.productId,
            quantity: diff.abs(),
            quantityDone: diff.abs(),
            sourceLocationId: diff.isNegative() ? line.locationId : virtualLocation.id,
            destLocationId: diff.isPositive() ? line.locationId : virtualLocation.id,
            status: "done"
          }
        });
        moveIds.push(move.id); // Update Quant
        if (quant) {
          await tx.stockQuant.update({
            where: {
              id: quant.id
            },
            data: {
              quantity: realQty
            }
          });
        } else {
          await tx.stockQuant.create({
            data: {
              companyId: session.companyId,
              locationId: line.locationId,
              productId: line.productId,
              quantity: realQty
            }
          });
        }
      }
    });
    // Accounting Entries
    for (const id of moveIds) {
      await generateStockMoveEntry(id);
    }
    revalidatePath("/[locale]/inventory/adjustments");
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Adjustment Error:", error);
    return {
      error: "حدث خطأ أثناء تطبيق الجرد."
    };
  }
}