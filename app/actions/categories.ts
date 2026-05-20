"use server";
import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
export async function createCategory(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const {
    name,
    parentId,
    costingMethod,
    valuation,
    removalStrategy,
    propertyAccountIncomeId,
    propertyAccountExpenseId,
    propertyAccountPriceDifferenceId,
    propertyStockValuationAccountId,
    propertyStockJournalId,
    propertyStockInputAccountId,
    propertyStockOutputAccountId
  } = data;
  let defaultIncomeId = propertyAccountIncomeId;
  let defaultExpenseId = propertyAccountExpenseId;
  let defaultStockValuationId = propertyStockValuationAccountId;
  let defaultStockInputId = propertyStockInputAccountId;
  let defaultStockOutputId = propertyStockOutputAccountId;
  let defaultStockJournalId = propertyStockJournalId;
  if (!defaultIncomeId || !defaultExpenseId || !defaultStockValuationId) {
    const accounts = await prisma.account.findMany({
      where: {
        code: {
          in: ['500001', '400002', '103029', '103039', '103049']
        }
      }
    });
    const getAcct = (code: string) => accounts.find(a => a.code === code)?.id;
    defaultIncomeId = defaultIncomeId || getAcct('500001');
    defaultExpenseId = defaultExpenseId || getAcct('400002');
    defaultStockValuationId = defaultStockValuationId || getAcct('103029');
    defaultStockInputId = defaultStockInputId || getAcct('103039');
    defaultStockOutputId = defaultStockOutputId || getAcct('103049');
  }
  if (!defaultStockJournalId) {
    const journal = await prisma.journal.findFirst({
      where: {
        name: {
          contains: 'المخزون'
        }
      }
    });
    defaultStockJournalId = journal?.id;
  }
  const category = await prisma.productCategory.create({
    data: {
      name,
      ...(parentId ? {
        parent: {
          connect: {
            id: parentId
          }
        }
      } : {}),
      costingMethod: costingMethod || 'avco',
      valuation: valuation || 'real_time',
      removalStrategy: removalStrategy !== undefined && removalStrategy !== null ? removalStrategy : "",
      ...(defaultIncomeId ? {
        propertyAccountIncomeId: defaultIncomeId
      } : {}),
      ...(defaultExpenseId ? {
        propertyAccountExpenseId: defaultExpenseId
      } : {}),
      ...(propertyAccountPriceDifferenceId ? {
        propertyAccountPriceDifferenceId
      } : {}),
      ...(defaultStockValuationId ? {
        propertyStockAccountId: defaultStockValuationId
      } : {}),
      ...(defaultStockInputId ? {
        propertyStockAccountInputId: defaultStockInputId
      } : {}),
      ...(defaultStockOutputId ? {
        propertyStockAccountOutputId: defaultStockOutputId
      } : {}),
      ...(defaultStockJournalId ? {
        propertyStockJournalId: defaultStockJournalId
      } : {})
    }
  });
  revalidatePath('/', 'layout');
  return category;
}
export async function updateCategory(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const {
    name,
    parentId,
    costingMethod,
    valuation,
    removalStrategy,
    propertyAccountIncomeId,
    propertyAccountExpenseId,
    propertyAccountPriceDifferenceId,
    propertyStockValuationAccountId,
    propertyStockJournalId,
    propertyStockInputAccountId,
    propertyStockOutputAccountId
  } = data;
  const updatedCategory = await prisma.productCategory.update({
    where: {
      id
    },
    data: {
      name,
      ...(parentId ? {
        parent: {
          connect: {
            id: parentId
          }
        }
      } : {
        parent: {
          disconnect: true
        }
      }),
      costingMethod: costingMethod || 'avco',
      valuation: valuation || 'real_time',
      removalStrategy: removalStrategy !== undefined && removalStrategy !== null ? removalStrategy : "",
      propertyAccountIncomeId: propertyAccountIncomeId || null,
      propertyAccountExpenseId: propertyAccountExpenseId || null,
      propertyAccountPriceDifferenceId: propertyAccountPriceDifferenceId || null,
      propertyStockAccountId: propertyStockValuationAccountId || null,
      propertyStockAccountInputId: propertyStockInputAccountId || null,
      propertyStockAccountOutputId: propertyStockOutputAccountId || null,
      propertyStockJournalId: propertyStockJournalId || null
    }
  });
  revalidatePath('/', 'layout');
  return updatedCategory;
}
export async function deleteCategory(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  try {
    const productCount = await prisma.product.count({
      where: {
        categoryId: id
      }
    });
    if (productCount > 0) {
      return {
        error: "لا يمكن حذف فئة تحتوي على منتجات. يرجى نقل المنتجات أولاً."
      };
    }
    const childCount = await prisma.productCategory.count({
      where: {
        parentId: id
      }
    });
    if (childCount > 0) {
      return {
        error: "لا يمكن حذف فئة تحتوي على فئات فرعية."
      };
    }
    await prisma.$transaction([prisma.stockPutawayRule.deleteMany({
      where: {
        categoryId: id
      }
    }), prisma.productCategory.delete({
      where: {
        id
      }
    })]);
    revalidatePath('/', 'layout');
    return {
      success: true
    };
  } catch (e: any) {
    console.error("Failed to delete category:", e);
    if (e.code === 'P2003' || e.message?.includes('Foreign key constraint')) {
      return {
        error: 'لا يمكن حذف الفئة لارتباطها بسجلات أخرى.'
      };
    }
    return {
      error: "حدث خطأ غير متوقع أثناء محاولة حذف الفئة."
    };
  }
}
export async function duplicateCategory(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const original = await prisma.productCategory.findUnique({
    where: {
      id
    }
  });
  if (!original) throw new Error("Category not found");
  const {
    id: _,
    odooId,
    ...data
  } = original;
  const newCategory = await prisma.productCategory.create({
    data: {
      ...data,
      name: `${data.name} (نسخة)`
    }
  });
  revalidatePath('/', 'layout');
  return newCategory;
}
export async function getCategory(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.productCategory.findUnique({
    where: {
      id
    },
    include: {
      parent: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  });
}
export async function getCategories() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.productCategory.findMany({
    include: {
      parent: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  });
}
export async function getAccounts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.account.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      type: true
    },
    orderBy: {
      code: 'asc'
    }
  });
}
export async function getJournals() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.journal.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      type: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}