"use server";

import prisma from '@/lib/prisma';
import { getCompanyId } from '@/lib/getCompanyId';
export type PricingResult = {
  price: number | null;
  discount?: number;
  appliedPriceListName?: string | null;
  warnings?: string[];
};
export async function getProductPrice(params: {
  productId: string;
  partnerId?: string | null;
  priceListId?: string | null;
  type: 'sale' | 'purchase';
  quantity: number;
  date: Date;
}): Promise<PricingResult> {
  const {
    productId,
    partnerId,
    priceListId,
    type,
    quantity,
    date
  } = params;
  const companyId = await getCompanyId();
  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    select: {
      id: true,
      categoryId: true,
      salePrice: true,
      costPrice: true
    }
  });
  if (!product) {
    throw new Error("Product not found");
  }
  const defaultPrice = type === 'sale' ? Number(product.salePrice) : Number(product.costPrice);
  const lookupDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const lookupDateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  let whereClause: any = {
    companyId,
    active: true,
    type,
    AND: [{
      OR: [{
        startDate: null
      }, {
        startDate: {
          lte: lookupDateEnd
        }
      }]
    }, {
      OR: [{
        endDate: null
      }, {
        endDate: {
          gte: lookupDate
        }
      }]
    }]
  };
  if (priceListId) {}
  const pricelists = await prisma.priceList.findMany({
    where: whereClause,
    include: {
      items: true,
      partners: partnerId ? {
        where: {
          id: partnerId
        },
        select: {
          id: true
        }
      } : false
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const filteredPricelists = pricelists.filter((list: any) => {
    const hasLegacyPartner = !!list.partnerId;
    const hasMultiPartners = list.partners && list.partners.length > 0;
    const isGlobal = !hasLegacyPartner && !hasMultiPartners;
    if (isGlobal) return true;
    if (!partnerId) return isGlobal;
    if (hasLegacyPartner && list.partnerId === partnerId) return true;
    if (list.partners && list.partners.length > 0) return true;
    return false;
  });
  if (!filteredPricelists.length) {
    return {
      price: defaultPrice,
      discount: 0,
      appliedPriceListName: null,
      warnings: []
    };
  }
  let bestMatch: any = null;
  let bestMatchList: any = null;
  let matchLevel = -1;
  let matchPartnerWeight = -1;
  const warnings: string[] = [];
  const matchedListsForWarning: Set<string> = new Set();
  for (const list of filteredPricelists) {
    const hasLegacyPartner = !!list.partnerId;
    const hasMultiPartners = (list as any).partners && (list as any).partners.length > 0;
    const isPartnerSpecific = hasLegacyPartner || hasMultiPartners ? 1 : 0;
    for (const item of list.items) {
      if (Number(item.minQuantity) > quantity) continue;
      if (item.startDate && new Date(item.startDate) > lookupDateEnd) continue;
      if (item.endDate && new Date(item.endDate) < lookupDate) continue;
      let currentLevel = -1;
      if (item.appliedOn === '1_product' && item.productId === productId) currentLevel = 3;else if (item.appliedOn === '2_category' && item.categoryId === product.categoryId) currentLevel = 2;else if (item.appliedOn === '3_global') currentLevel = 1;
      if (currentLevel === -1) continue;
      // Partner specfic beats general. If same partner specificity, higher level beats lower level. // If same level, the one created latest (already ordered desc) wins.
      if (isPartnerSpecific > matchPartnerWeight || isPartnerSpecific === matchPartnerWeight && currentLevel > matchLevel) {
        bestMatch = item;
        bestMatchList = list;
        matchLevel = currentLevel;
        matchPartnerWeight = isPartnerSpecific;
        matchedListsForWarning.clear();
        matchedListsForWarning.add(list.name);
      } else if (isPartnerSpecific === matchPartnerWeight && currentLevel === matchLevel) {
        // We found another list that also perfectly matches at the SAME level. // Since lists are ordered by `createdAt: 'desc'`, the first one we found (bestMatch) is the 'last added' one and stays the winner. // But we should warn the user about the overlap.
        if (list.id !== bestMatchList.id) {
          matchedListsForWarning.add(list.name);
        }
      }
    }
  }
  if (matchedListsForWarning.size > 1) {
    warnings.push(`يوجد تداخل بين القوائم: ${Array.from(matchedListsForWarning).join(' و ')}. تم تطبيق الأحدث.`);
  }
  if (!bestMatch) {
    return {
      price: defaultPrice,
      discount: 0,
      appliedPriceListName: null,
      warnings: []
    };
  }
  let finalPrice = defaultPrice;
  let finalDiscount = 0;
  if (bestMatch.computePrice === 'percentage') {
    finalDiscount = Number(bestMatch.percentPrice);
    finalPrice = defaultPrice; // Usually discount is applied as a separate field in Line
  } else {
    finalPrice = type === 'sale' ? Number(bestMatch.price) : Number(bestMatch.buyPrice || bestMatch.price);
    finalDiscount = 0;
  }
  return {
    price: finalPrice,
    discount: finalDiscount,
    appliedPriceListName: bestMatchList.name,
    warnings
  };
}