"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';
import { getSession } from '@/lib/auth';
import { ensureAccess } from '@/lib/access';
export async function getPriceList(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product_pricelist", "read");

  if (id === 'new') return null;
  return await prisma.priceList.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      partners: true,
      items: {
        include: {
          product: true,
          category: true
        }
      }
    }
  });
}
export async function getPriceListWithPaginatedItems(id: string, page: number = 1, pageSize: number = 10) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product_pricelist", "read");

  if (id === 'new') return null;
  const list = await prisma.priceList.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      partners: true
    }
  });
  if (!list) return null;
  const skip = (page - 1) * pageSize;
  const [items, totalItems] = await Promise.all([prisma.priceListItem.findMany({
    where: {
      priceListId: id
    },
    include: {
      product: true,
      category: true
    },
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'asc'
    }
  }), prisma.priceListItem.count({
    where: {
      priceListId: id
    }
  })]);
  return {
    ...list,
    items,
    totalItems,
    currentPage: page,
    totalPages: Math.ceil(totalItems / pageSize),
    startRecord: skip + 1,
    endRecord: Math.min(skip + pageSize, totalItems)
  };
}
export async function getPriceListItems(priceListId: string, opts: {
  page?: number;
  pageSize?: number;
  q?: string;
  filter?: string;
} = {}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product_pricelist", "read");

  const {
    page = 1,
    pageSize = 80,
    q,
    filter
  } = opts;
  const skip = (page - 1) * pageSize;
  const where: any = {
    priceListId
  };
  if (q) {
    where.product = {
      name: {
        contains: q
      }
    };
  }
  if (filter === 'archived') {}
  const [items, totalCount] = await Promise.all([prisma.priceListItem.findMany({
    where,
    include: {
      product: true,
      category: true
    },
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'asc'
    }
  }), prisma.priceListItem.count({
    where
  })]);
  return {
    items,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / pageSize),
    startRecord: totalCount > 0 ? skip + 1 : 0,
    endRecord: Math.min(skip + pageSize, totalCount)
  };
}
export async function getAllPriceLists() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product_pricelist", "read");

  return await prisma.priceList.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      partner: true,
      partners: {
        select: {
          id: true,
          name: true
        }
      }
    },
    take: 100
  });
}
export async function createPriceList(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('pricelist', 'create');
  try {
    const list = await prisma.priceList.create({
      data: {
        name: data.name,
        currencyId: '000-000',
        active: data.active ?? true,
        type: data.type || 'sale',
        partnerId: data.partnerId || null,
        companyId: await getCompanyId(),
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        producingCompany: data.producingCompany || null,
        arCode: data.arCode || null,
        categoryId: data.categoryId || null,
        discount1: parseFloat(data.discount1) || 0,
        discount2: parseFloat(data.discount2) || 0,
        discount3: parseFloat(data.discount3) || 0,
        addition: parseFloat(data.addition) || 0,
        partners: data.partnerIds?.length ? {
          connect: data.partnerIds.map((pid: string) => ({
            id: pid
          }))
        } : undefined
      }
    });
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await prisma.priceListItem.create({
          data: {
            priceListId: list.id,
            appliedOn: item.appliedOn || '1_product',
            categoryId: item.categoryId || null,
            productId: item.productId || null,
            computePrice: item.computePrice || 'fixed',
            percentPrice: parseFloat(item.percentPrice) || 0,
            minQuantity: parseFloat(item.minQuantity) || 0,
            price: parseFloat(item.price) || 0,
            buyPrice: parseFloat(item.buyPrice) || 0,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null
          }
        });
      }
    }
    revalidatePath('/sales/pricelists');
    return {
      success: true,
      list
    };
  } catch (e: any) {
    console.error("Create PriceList Error:", e);
    return {
      error: e.message || "حدث خطأ غير معروف أثناء الحفظ"
    };
  }
}
export async function updatePriceList(id: string, data: any) {
  try {
    await ensureAccess('pricelist', 'write');
    await prisma.priceList.update({
      where: {
        id
      },
      data: {
        name: data.name,
        active: data.active,
        type: data.type || 'sale',
        partnerId: data.partnerId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        producingCompany: data.producingCompany || null,
        arCode: data.arCode || null,
        categoryId: data.categoryId || null,
        discount1: parseFloat(data.discount1) || 0,
        discount2: parseFloat(data.discount2) || 0,
        discount3: parseFloat(data.discount3) || 0,
        addition: parseFloat(data.addition) || 0,
        partners: {
          set: (data.partnerIds || []).map((pid: string) => ({
            id: pid
          }))
        }
      }
    });
    if (data.items) {
      for (const item of data.items) {
        if (item.id && !item.id.startsWith('new_')) {
          await prisma.priceListItem.update({
            where: {
              id: item.id
            },
            data: {
              appliedOn: item.appliedOn || '1_product',
              categoryId: item.categoryId || null,
              productId: item.productId || null,
              computePrice: item.computePrice || 'fixed',
              percentPrice: parseFloat(item.percentPrice) || 0,
              minQuantity: parseFloat(item.minQuantity) || 0,
              price: parseFloat(item.price) || 0,
              buyPrice: parseFloat(item.buyPrice) || 0,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null
            }
          });
        } else {
          await prisma.priceListItem.create({
            data: {
              priceListId: id,
              appliedOn: item.appliedOn || '1_product',
              categoryId: item.categoryId || null,
              productId: item.productId || null,
              computePrice: item.computePrice || 'fixed',
              percentPrice: parseFloat(item.percentPrice) || 0,
              minQuantity: parseFloat(item.minQuantity) || 0,
              price: parseFloat(item.price) || 0,
              buyPrice: parseFloat(item.buyPrice) || 0,
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null
            }
          });
        }
      }
    }
    revalidatePath(`/sales/pricelists/${id}`);
    return {
      success: true
    };
  } catch (e: any) {
    console.error("Update PriceList Error:", e);
    return {
      error: e.message || "حدث خطأ غير معروف أثناء التحديث"
    };
  }
}
export async function deletePriceListItem(id: string) {
  await ensureAccess('pricelist', 'write');
  await prisma.priceListItem.delete({
    where: {
      id
    }
  });
  revalidatePath('/sales/pricelists/[id]');
}
export async function deletePriceList(id: string) {
  await ensureAccess('pricelist', 'write');
  await prisma.priceListItem.deleteMany({
    where: {
      priceListId: id
    }
  });
  await prisma.priceList.update({
    where: {
      id
    },
    data: {
      partners: {
        set: []
      }
    }
  });
  await prisma.priceList.delete({
    where: {
      id
    }
  });
  revalidatePath('/sales/pricelists');
  revalidatePath('/purchases/pricelists');
}
export async function deletePriceLists(ids: string[]) {
  try {
    await ensureAccess('pricelist', 'write');
    for (const id of ids) {
      await prisma.priceListItem.deleteMany({
        where: {
          priceListId: id
        }
      });
      await prisma.priceList.update({
        where: {
          id
        },
        data: {
          partners: {
            set: []
          }
        }
      });
      await prisma.priceList.delete({
        where: {
          id
        }
      });
    }
    revalidatePath('/sales/pricelists');
    revalidatePath('/purchases/pricelists');
    return {
      success: true,
      count: ids.length
    };
  } catch (e: any) {
    console.error("Delete PriceLists Error:", e);
    return {
      error: e.message || 'خطأ في حذف القوائم'
    };
  }
}
export async function addCategoryToPriceList(priceListId: string, categoryId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('pricelist', 'write');
  const products = await prisma.product.findMany({
    where: {
      categoryId
    }
  });
  if (products.length === 0) return {
    count: 0
  };
  let count = 0;
  for (const product of products) {
    const existing = await prisma.priceListItem.findFirst({
      where: {
        priceListId,
        productId: product.id
      }
    });
    if (!existing) {
      await prisma.priceListItem.create({
        data: {
          priceListId,
          productId: product.id,
          price: product.salePrice,
          buyPrice: product.costPrice
        }
      });
      count++;
    }
  }
  revalidatePath(`/sales/pricelists/${priceListId}`);
  return {
    count
  };
}
export async function addManufacturerToPriceList(priceListId: string, manufacturer: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product_pricelist", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const products = await prisma.product.findMany({
    where: {
      manufacturer: {
        contains: manufacturer
      }
    }
  });
  if (products.length === 0) return {
    count: 0
  };
  let count = 0;
  for (const product of products) {
    const existing = await prisma.priceListItem.findFirst({
      where: {
        priceListId,
        productId: product.id
      }
    });
    if (!existing) {
      await prisma.priceListItem.create({
        data: {
          priceListId,
          productId: product.id,
          price: product.salePrice,
          buyPrice: product.costPrice
        }
      });
      count++;
    }
  }
  revalidatePath(`/sales/pricelists/${priceListId}`);
  return {
    count
  };
}
export async function getProductsForBulkAdd(type: 'category' | 'manufacturer', value: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product_pricelist", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const where: any = {};
  if (type === 'category') where.categoryId = value;
  if (type === 'manufacturer') where.manufacturer = {
    contains: value
  };
  return await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      salePrice: true,
      costPrice: true
    }
  });
}