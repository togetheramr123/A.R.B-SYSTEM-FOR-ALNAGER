"use server";
import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
export async function getCategory(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === "new") return null;
  return await prisma.productCategory.findUnique({
    where: {
      id
    },
    include: {
      parent: true
    }
  });
}
export async function getAllCategories() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.productCategory.findMany();
}
export async function getAllAccounts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.account.findMany({
    orderBy: {
      code: "asc"
    }
  });
}
export async function getAllJournals() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.journal.findMany();
}
export async function createCategory(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const parentId = data.parentId || null;
  const cat = await prisma.productCategory.create({
    data: {
      name: data.name,
      parentId: parentId,
      costingMethod: data.costingMethod,
      valuation: data.valuation,
      propertyAccountIncomeId: data.propertyAccountIncomeId || null,
      propertyAccountExpenseId: data.propertyAccountExpenseId || null,
      propertyStockAccountId: data.propertyStockAccountId || null,
      propertyStockAccountInputId: data.propertyStockAccountInputId || null,
      propertyStockAccountOutputId: data.propertyStockAccountOutputId || null,
      propertyStockJournalId: data.propertyStockJournalId || null
    }
  });
  revalidatePath("/inventory/products/categories");
  return cat;
}
export async function updateCategory(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  await prisma.productCategory.update({
    where: {
      id
    },
    data: {
      name: data.name,
      parentId: data.parentId || null,
      costingMethod: data.costingMethod,
      valuation: data.valuation,
      propertyAccountIncomeId: data.propertyAccountIncomeId || null,
      propertyAccountExpenseId: data.propertyAccountExpenseId || null,
      propertyStockAccountId: data.propertyStockAccountId || null,
      propertyStockAccountInputId: data.propertyStockAccountInputId || null,
      propertyStockAccountOutputId: data.propertyStockAccountOutputId || null,
      propertyStockJournalId: data.propertyStockJournalId || null
    }
  });
  revalidatePath(`/inventory/products/categories/${id}`);
  revalidatePath("/inventory/products/categories");
}