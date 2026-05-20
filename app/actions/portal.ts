"use server";
import { getSession } from "@/lib/auth";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getPortalUser } from '@/lib/portalAuth';
import { Decimal } from '@prisma/client/runtime/library';
export async function getPortalProducts(options?: {
  categoryId?: string;
  search?: string;
  favoriteOnly?: boolean;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return {
    products: [],
    categories: []
  };
  const companyId = portalUser.companyId;
  const partnerId = portalUser.partnerId;
  const partner = await prisma.partner.findUnique({
    where: {
      id: partnerId
    },
    select: {
      propertyPriceListId: true
    }
  });
  const priceListId = partner?.propertyPriceListId;
  const where: any = {
    active: true,
    canBeSold: true,
    companyId,
    templateId: null
  };
  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }
  if (options?.search) {
    const search = options.search;
    where.OR = [{
      name: {
        contains: search
      }
    }, {
      barcode: {
        contains: search
      }
    }, {
      internalReference: {
        contains: search
      }
    }, {
      description: {
        contains: search
      }
    }];
  }
  let favoriteProductIds: string[] = [];
  if (options?.favoriteOnly) {
    const favorites = await prisma.portalFavorite.findMany({
      where: {
        portalUserId: portalUser.id
      },
      select: {
        productId: true
      }
    });
    favoriteProductIds = favorites.map(f => f.productId);
    where.id = {
      in: favoriteProductIds
    };
  }
  const products = await prisma.product.findMany({
    where,
    orderBy: {
      name: 'asc'
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      stockQuants: {
        select: {
          quantity: true
        },
        where: {
          companyId
        }
      }
    },
    take: 200
  });
  const allFavorites = await prisma.portalFavorite.findMany({
    where: {
      portalUserId: portalUser.id
    },
    select: {
      productId: true
    }
  });
  const favoriteSet = new Set(allFavorites.map(f => f.productId));
  let priceListItems: any[] = [];
  if (priceListId) {
    const priceList = await prisma.priceList.findUnique({
      where: {
        id: priceListId
      },
      include: {
        items: true
      }
    });
    if (priceList?.active) {
      priceListItems = priceList.items;
    }
  }
  const mappedProducts = products.map(product => {
    const totalStock = product.stockQuants.reduce((sum, q) => sum + Number(new Decimal(q.quantity).toString()), 0);
    const isAvailable = totalStock > 0;
    let price = Number(new Decimal(product.salePrice || 0).toString());
    let hasDiscount = false;
    let originalPrice = price;
    if (priceListId && priceListItems.length > 0) {
      const item = priceListItems.find((i: any) => i.productId === product.id);
      if (item) {
        const itemPrice = Number(new Decimal(item.price || 0).toString());
        if (itemPrice > 0) {
          if (itemPrice < price) {
            hasDiscount = true;
            originalPrice = price;
          }
          price = itemPrice;
        }
      }
    }
    return {
      id: product.id,
      name: product.name,
      description: product.descriptionSale || product.description || '',
      image: product.image,
      uom: product.uom,
      categoryId: product.categoryId,
      categoryName: product.category?.name || '',
      barcode: product.barcode,
      internalReference: product.internalReference,
      price,
      originalPrice: hasDiscount ? originalPrice : undefined,
      hasDiscount,
      isAvailable,
      isFavorite: favoriteSet.has(product.id)
    };
  });
  const categories = await prisma.productCategory.findMany({
    where: {
      companyId
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              active: true,
              canBeSold: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
  const mappedCategories = categories.filter(c => c._count.products > 0).map(c => ({
    id: c.id,
    name: c.name,
    productCount: c._count.products
  }));
  return {
    products: mappedProducts,
    categories: mappedCategories
  };
}
export async function getPortalBanners() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return [];
  return prisma.portalBanner.findMany({
    where: {
      companyId: portalUser.companyId,
      active: true
    },
    orderBy: {
      sortOrder: 'asc'
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      linkUrl: true
    }
  });
}
export async function togglePortalFavorite(productId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return {
    success: false
  };
  const existing = await prisma.portalFavorite.findUnique({
    where: {
      portalUserId_productId: {
        portalUserId: portalUser.id,
        productId
      }
    }
  });
  if (existing) {
    await prisma.portalFavorite.delete({
      where: {
        id: existing.id
      }
    });
    return {
      success: true,
      isFavorite: false
    };
  } else {
    await prisma.portalFavorite.create({
      data: {
        portalUserId: portalUser.id,
        productId
      }
    });
    return {
      success: true,
      isFavorite: true
    };
  }
}