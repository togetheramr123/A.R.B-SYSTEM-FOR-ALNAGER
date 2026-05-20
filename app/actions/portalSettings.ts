"use server";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export async function getAdminBanners() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session || !session.companyId) return [];
  return await prisma.portalBanner.findMany({
    where: {
      companyId: session.companyId
    },
    orderBy: {
      sortOrder: "asc"
    }
  });
}
export async function createAdminBanner(data: {
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session || !session.companyId) return {
    success: false,
    error: "Unauthorized"
  };
  try {
    await prisma.portalBanner.create({
      data: {
        ...data,
        companyId: session.companyId,
        active: true
      }
    });
    revalidatePath("/[locale]/settings/portal");
    revalidatePath("/portal");
    return {
      success: true
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: "حدث خطأ"
    };
  }
}
export async function updateAdminBanner(id: string, data: {
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  sortOrder?: number;
  active?: boolean;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session || !session.companyId) return {
    success: false,
    error: "Unauthorized"
  };
  try {
    await prisma.portalBanner.update({
      where: {
        id
      },
      data
    });
    revalidatePath("/[locale]/settings/portal");
    revalidatePath("/portal");
    return {
      success: true
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: "حدث خطأ"
    };
  }
}
export async function deleteAdminBanner(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session || !session.companyId) return {
    success: false,
    error: "Unauthorized"
  };
  try {
    await prisma.portalBanner.delete({
      where: {
        id
      }
    });
    revalidatePath("/[locale]/settings/portal");
    revalidatePath("/portal");
    return {
      success: true
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: "حدث خطأ"
    };
  }
}