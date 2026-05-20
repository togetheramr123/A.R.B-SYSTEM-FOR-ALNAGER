"use server";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkAccess } from "@/lib/access";
import { getCompanyId } from "@/lib/getCompanyId";
export async function getPartners(search?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  const companyId = await getCompanyId();
  const where: any = {
    companyId: session.companyId || companyId
  };
  if (search) {
    where.name = {
      contains: search
    };
  }
  const partners = await prisma.partner.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true
    },
    orderBy: {
      name: "asc"
    },
    take: 50
  });
  return partners;
}
export async function getPartnerFormPermissions() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    canSetCommercial: false,
    canSeePurchases: false,
    canSeeSales: false,
    canSeeAccounting: false
  };
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    },
    select: {
      role: true,
      allowedLedgerCustomerTypes: true
    }
  });
  if (!user) return {
    canSetCommercial: false,
    canSeePurchases: false,
    canSeeSales: false,
    canSeeAccounting: false
  };
  /* Admin or specific permission can set 'commercial' */
  const canSetCommercial = user.role === "ADMIN" || user.allowedLedgerCustomerTypes === "all" || user.allowedLedgerCustomerTypes === "commercial";
  /* Check module-level access for smart buttons */
  const canSeePurchases = await checkAccess("purchase.order", "read");
  const canSeeSales = await checkAccess("sale.order", "read");
  const canSeeAccounting = await checkAccess("account.move", "read");
  return {
    canSetCommercial,
    canSeePurchases,
    canSeeSales,
    canSeeAccounting
  };
}