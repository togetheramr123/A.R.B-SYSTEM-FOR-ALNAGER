"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
export async function getAllProducts() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  const products = await prisma.product.findMany({
    where: {
      active: true,
      companyId: session.companyId
    },
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true,
      salePrice: true,
      costPrice: true,
      uom: true,
      hasSecondaryUnit: true,
      secondaryUom: true,
      secondaryUomFactor: true,
      categoryId: true,
      internalReference: true,
      type: true,
      taxes: true,
      weight: true,
      volume: true,
      category: { select: { name: true } },
      _count: { select: { attributeLines: true } },
      stockQuants: {
        where: { location: { type: 'internal' } },
        select: { quantity: true }
      }
    }
  });
  return products.map(product => ({
    ...product,
    salePrice: product.salePrice ? Number(product.salePrice.toString()) : 0,
    costPrice: product.costPrice ? Number(product.costPrice.toString()) : 0,
    taxes: product.taxes ? Number(product.taxes.toString()) : 0,
    weight: product.weight ? Number(product.weight.toString()) : 0,
    volume: product.volume ? Number(product.volume.toString()) : 0,
    hasVariants: (product._count?.attributeLines || 0) > 0,
    secondaryUomFactor: product.secondaryUomFactor ? Number(product.secondaryUomFactor.toString()) : 1,
    categoryId: product.categoryId || '',
    categoryName: product.category?.name || '',
    quantityOnHand: product.stockQuants?.reduce((sum: number, q: any) => sum + Number(q.quantity || 0), 0) || 0
  }));
}
export async function getProductCategories() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  const categories = await prisma.productCategory.findMany({
    where: {
      companyId: session.companyId
    },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
  return categories.map(c => ({
    id: c.id,
    name: c.name,
    productCount: c._count.products
  }));
}
export async function getProduct(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return null;
  const product = await prisma.product.findUnique({
    where: {
      id
    },
    include: {
      _count: {
        select: {
          attributeLines: true
        }
      },
      category: true
    }
  });
  if (!product) return null;
  return {
    ...product,
    salePrice: product.salePrice ? Number(product.salePrice.toString()) : 0,
    costPrice: product.costPrice ? Number(product.costPrice.toString()) : 0,
    taxes: product.taxes ? Number(product.taxes.toString()) : 0,
    weight: product.weight ? Number(product.weight.toString()) : 0,
    volume: product.volume ? Number(product.volume.toString()) : 0,
    hasVariants: (product._count?.attributeLines || 0) > 0,
    secondaryUomFactor: product.secondaryUomFactor ? Number(product.secondaryUomFactor.toString()) : 1
  };
}
export async function getProductPrice(productId: string, priceListId?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    price: 0,
    cost: 0
  };
  const product = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });
  if (!product) return {
    price: 0,
    cost: 0
  };
  ;
  const priceList = await prisma.priceList.findUnique({
    where: {
      id: priceListId
    },
    include: {
      items: {
        where: {
          productId
        }
      }
    }
  });
  if (!priceList || !priceList.active) {
    return {
      price: 0,
      cost: 0
    };
  }
  const now = new Date();
  if (priceList.startDate && priceList.startDate > now) return {
    price: 0,
    cost: 0
  };
  if (priceList.endDate && priceList.endDate < now) return {
    price: 0,
    cost: 0
  };
  const item = priceList.items[0];
  if (item) {
    const buyPrice = new Decimal(item.buyPrice || 0);
    const costPrice = new Decimal(product.costPrice || 0);
    return {
      price: new Decimal(item.price || 0).toNumber(),
      cost: buyPrice.gt(0) ? buyPrice.toNumber() : costPrice.toNumber()
    };
  } else {
    return {
      price: 0,
      cost: 0
    };
  }
}
;
export async function getVariantGridData(productId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return null;
  const productTemplate = await prisma.product.findUnique({
    where: {
      id: productId
    },
    include: {
      attributeLines: {
        include: {
          attribute: true,
          values: true
        }
      },
      variants: {
        include: {
          variantValues: true
        }
      }
    }
  });
  if (!productTemplate || productTemplate.attributeLines.length === 0) return null;
  const variantsWithStock = productTemplate.variants.map(v => {
    return {
      id: v.id,
      name: v.name,
      quantityOnHand: 0
    };
  });
  return {
    templateId: productTemplate.id,
    templateName: productTemplate.name,
    attributes: productTemplate.attributeLines.map(line => ({
      id: line.attribute.id,
      name: line.attribute.name,
      values: line.values.map(v => ({
        id: v.id,
        name: v.name
      }))
    })),
    variants: variantsWithStock
  };
}

export async function getPromotedProducts() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const products = await prisma.product.findMany({
    where: {
      active: true,
      companyId: session.companyId,
      isPromotedForSale: true
    },
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true,
      salePrice: true,
      costPrice: true,
      uom: true,
      taxes: true
    }
  });

  return products.map(product => ({
    ...product,
    salePrice: product.salePrice ? Number(product.salePrice.toString()) : 0,
    costPrice: product.costPrice ? Number(product.costPrice.toString()) : 0,
    taxes: product.taxes ? Number(product.taxes.toString()) : 0,
  }));
}