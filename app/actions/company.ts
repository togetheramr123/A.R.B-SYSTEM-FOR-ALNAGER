"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureAccess } from "@/lib/access";
export async function updateCompanySettings(data: {
  allowHalfQuantities?: boolean;
  demoPin?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("غير مصرح لك بتعديل إعدادات الشركة");
  }
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      return {
        success: false,
        error: "لم يتم العثور على الشركة"
      };
    }
    await prisma.company.update({
      where: {
        id: company.id
      },
      data: {
        allowHalfQuantities: data.allowHalfQuantities,
        ...(data.demoPin ? { demoPin: data.demoPin } : {})
      }
    });
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Error updating company settings:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getCompanies() {
  const session = await getSession();
  if (!session) return [];
  try {
    return await prisma.company.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}