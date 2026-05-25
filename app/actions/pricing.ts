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
    warnings,
    // نسب الخصم على مستوى القائمة
    priceListDiscount1: Number(bestMatchList.discount1) || 0,
    priceListDiscount2: Number(bestMatchList.discount2) || 0,
    priceListDiscount3: Number(bestMatchList.discount3) || 0,
    priceListAddition: Number(bestMatchList.addition) || 0,
  };
}

// === جلب خيارات التسعير للعميل (اتفاقية vs قائمة أسعار) ===
export type PricingOption = {
  source: 'agreement' | 'pricelist';
  name: string;
  discount1: number;
  discount2: number;
  discount3: number;
  addition: number;
  id: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type PartnerPricingOptions = {
  hasConflict: boolean;
  agreement: PricingOption | null;
  pricelist: PricingOption | null;
};

export async function getPartnerPricingOptions(partnerId: string, type: 'sale' | 'purchase'): Promise<PartnerPricingOptions> {
  const companyId = await getCompanyId();
  const now = new Date();

  // 1. جلب اتفاقية العميل
  let agreement: PricingOption | null = null;
  if (type === 'sale') {
    const saleAgreement = await prisma.saleAgreement.findFirst({
      where: {
        partnerId,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
      },
      orderBy: { startDate: 'desc' }
    });
    if (saleAgreement && (Number(saleAgreement.discount1) > 0 || Number(saleAgreement.discount2) > 0 || Number(saleAgreement.discount3) > 0)) {
      agreement = {
        source: 'agreement',
        name: `اتفاقية بيع - ${saleAgreement.group || 'عامة'}`,
        discount1: Number(saleAgreement.discount1),
        discount2: Number(saleAgreement.discount2),
        discount3: Number(saleAgreement.discount3),
        addition: Number(saleAgreement.addition),
        id: saleAgreement.id,
        startDate: saleAgreement.startDate?.toISOString() || null,
        endDate: saleAgreement.endDate?.toISOString() || null,
      };
    }
  } else {
    const purchaseAgreement = await prisma.purchaseAgreement.findFirst({
      where: {
        partnerId,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
      },
      orderBy: { startDate: 'desc' }
    });
    if (purchaseAgreement && (Number(purchaseAgreement.discount1) > 0 || Number(purchaseAgreement.discount2) > 0 || Number(purchaseAgreement.discount3) > 0)) {
      agreement = {
        source: 'agreement',
        name: `اتفاقية شراء - ${purchaseAgreement.group || 'عامة'}`,
        discount1: Number(purchaseAgreement.discount1),
        discount2: Number(purchaseAgreement.discount2),
        discount3: Number(purchaseAgreement.discount3),
        addition: Number(purchaseAgreement.addition),
        id: purchaseAgreement.id,
        startDate: purchaseAgreement.startDate?.toISOString() || null,
        endDate: purchaseAgreement.endDate?.toISOString() || null,
      };
    }
  }

  // 2. جلب قائمة الأسعار المطبقة على العميل
  let pricelist: PricingOption | null = null;
  const matchingPricelist = await prisma.priceList.findFirst({
    where: {
      companyId,
      active: true,
      type,
      OR: [
        { discount1: { gt: 0 } },
        { discount2: { gt: 0 } },
        { discount3: { gt: 0 } },
      ],
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        {
          OR: [
            { partnerId: partnerId },
            { partners: { some: { id: partnerId } } },
          ]
        }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  if (matchingPricelist) {
    pricelist = {
      source: 'pricelist',
      name: matchingPricelist.name,
      discount1: Number(matchingPricelist.discount1),
      discount2: Number(matchingPricelist.discount2),
      discount3: Number(matchingPricelist.discount3),
      addition: Number(matchingPricelist.addition),
      id: matchingPricelist.id,
      startDate: matchingPricelist.startDate?.toISOString() || null,
      endDate: matchingPricelist.endDate?.toISOString() || null,
    };
  }

  return {
    hasConflict: !!agreement && !!pricelist,
    agreement,
    pricelist,
  };
}