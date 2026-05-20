"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';
async function getFirstCompany() {
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found in database. Please run seeding.");
  return company;
}
export async function createReturnPicking(pickingId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('stock_picking', 'create');
  try {
    const original = await prisma.stockPicking.findUnique({
      where: {
        id: pickingId
      },
      include: {
        moves: true
      }
    });
    if (!original) return {
      success: false,
      error: 'إذن المخزن غير موجود'
    };
    const company = await getFirstCompany();
    const returnType = original.pickingType === 'OUTGOING' || original.pickingType === 'outgoing' ? 'INCOMING' : 'OUTGOING';
    const name = `RET/${original.name}`;
    
    const newPicking = await prisma.stockPicking.create({
      data: {
        name,
        companyId: company.id,
        pickingType: returnType,
        locationId: original.locationDestId,
        locationDestId: original.locationId,
        partnerId: original.partnerId,
        status: 'draft',
        origin: original.name,
        scheduledDate: new Date(),
        moves: {
          create: original.moves.map((move: any) => ({
            name: `[إرجاع] ${move.name}`,
            productId: move.productId,
            quantity: move.quantity,
            locationId: original.locationDestId,
            locationDestId: original.locationId,
            status: 'draft',
            companyId: company.id
          }))
        }
      }
    });

    try {
      revalidatePath('/[locale]/inventory/transfers');
      if (newPicking.id) revalidatePath(`/[locale]/inventory/transfers/${newPicking.id}`);
    } catch (error) { console.error("Silent error caught in app/actions/returns.ts:", error); }

    return {
      success: true,
      pickingId: newPicking.id
    };
  } catch (error: any) {
    console.error("Failed to create return picking:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ غير معروف"
    };
  }
}