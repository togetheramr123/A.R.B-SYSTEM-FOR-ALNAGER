"use server";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth"; // ---------------------------------------------------------------------------
// 1. Stock Putaway Rules
// ---------------------------------------------------------------------------
export async function getPutawayRules() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.stockPutawayRule.findMany({
    include: {
      product: true,
      category: true,
      inLocation: true,
      outLocation: true
    },
    orderBy: {
      sequence: "asc"
    }
  });
}
export async function createPutawayRule(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockPutawayRule.create({
    data
  });
}
export async function updatePutawayRule(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockPutawayRule.update({
    where: {
      id
    },
    data
  });
}
export async function deletePutawayRule(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockPutawayRule.delete({
    where: {
      id
    }
  });
} // ---------------------------------------------------------------------------
// 2. Stock Replenishments (Orderpoints)
// ---------------------------------------------------------------------------
export async function getReplenishments() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.stockReplenishment.findMany({
    include: {
      product: true,
      location: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}
export async function createReplenishment(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockReplenishment.create({
    data
  });
}
export async function deleteReplenishment(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockReplenishment.delete({
    where: {
      id
    }
  });
} // ---------------------------------------------------------------------------
// 3. Stock Routes & Rules
// ---------------------------------------------------------------------------
export async function getRoutes() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.stockRoute.findMany({
    include: {
      rules: true
    },
    orderBy: {
      sequence: "asc"
    }
  });
}
export async function createRoute(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockRoute.create({
    data
  });
}
export async function updateRoute(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockRoute.update({
    where: {
      id
    },
    data
  });
}
export async function deleteRoute(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockRoute.delete({
    where: {
      id
    }
  });
}
export async function getRules() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.stockRule.findMany({
    include: {
      route: true,
      sourceLoc: true,
      destLoc: true,
      pickingType: true
    },
    orderBy: {
      sequence: "asc"
    }
  });
}
export async function createRule(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockRule.create({
    data
  });
}
export async function updateRule(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockRule.update({
    where: {
      id
    },
    data
  });
}
export async function deleteRule(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockRule.delete({
    where: {
      id
    }
  });
} // ---------------------------------------------------------------------------
// 4. Operation Types
// ---------------------------------------------------------------------------
export async function getOperationTypes() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.operationType.findMany({
    include: {
      defaultSource: true,
      defaultDest: true
    },
    orderBy: {
      sequence: "asc"
    }
  });
}
export async function createOperationType(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.operationType.create({
    data
  });
}
export async function deleteOperationType(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.operationType.delete({
    where: {
      id
    }
  });
} // ---------------------------------------------------------------------------
// 5. Delivery Methods
// ---------------------------------------------------------------------------
export async function getDeliveryMethods() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.deliveryMethod.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
}
export async function createDeliveryMethod(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.deliveryMethod.create({
    data
  });
}
export async function deleteDeliveryMethod(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.deliveryMethod.delete({
    where: {
      id
    }
  });
} // ---------------------------------------------------------------------------
// 6. Stock Scrap
// ---------------------------------------------------------------------------
export async function getScraps() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.stockScrap.findMany({
    include: {
      product: true,
      sourceLocation: true,
      scrapLocation: true
    },
    orderBy: {
      date: "desc"
    }
  });
}
export async function createScrap(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  return prisma.stockScrap.create({
    data
  });
} // ---------------------------------------------------------------------------
// 8. Locations
// ---------------------------------------------------------------------------
export async function getLocations() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.location.findMany({
    orderBy: {
      name: "asc"
    }
  });
} // ---------------------------------------------------------------------------
// 7. UoM Categories & UoM
// ---------------------------------------------------------------------------
export async function getUomCategories() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.uomCategory.findMany({
    orderBy: {
      name: "asc"
    }
  });
}
export async function getUoms() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return prisma.uom.findMany({
    include: {
      category: true
    },
    orderBy: {
      name: "asc"
    }
  });
}