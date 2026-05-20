"use server";

import prisma from "@/lib/prisma";
import { getCompanyId } from "@/lib/getCompanyId";
import { getSession } from "@/lib/auth";
import { ensureAccess } from "@/lib/access";
export async function getAnalyticAccounts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.analyticAccount.findMany({
    orderBy: {
      name: "asc"
    }
  });
}
export async function getAnalyticAccount(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.analyticAccount.findUnique({
    where: {
      id
    },
    include: {
      parent: true,
      children: true
    }
  });
}
export async function createAnalyticAccount(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("analytic_account", "create");
  const {
    generateAnalyticCode
  } = await import("@/lib/autoCode");
  const code = data.code || (await generateAnalyticCode());
  return await prisma.analyticAccount.create({
    data: {
      name: data.name,
      code,
      companyId: await getCompanyId()
    }
  });
}