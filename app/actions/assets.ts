"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';
import { getSession } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { ensureAccess } from '@/lib/access';
import { logAuditAction } from "@/app/actions/audit";
export async function getAsset(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === 'new') return null;
  return await prisma.asset.findUnique({
    where: {
      id
    },
    include: {
      category: true,
      details: {
        orderBy: {
          date: 'asc'
        },
        include: {
          move: true
        }
      }
    }
  });
}
export async function getAllAssets() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.asset.findMany({
    include: {
      category: true
    },
    orderBy: {
      date: 'desc'
    },
    take: 200
  });
}
export async function getAllAssetCategories() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.assetCategory.findMany();
}
export async function createAsset(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('asset', 'create');
  const asset = await prisma.asset.create({
    data: {
      name: data.name,
      originalValue: Number(data.originalValue),
      bookValue: Number(data.originalValue),
      salvageValue: Number(data.salvageValue || 0),
      date: new Date(data.date),
      categoryId: data.categoryId,
      duration: parseInt(data.duration) || 5,
      companyId: (await getCompanyId())!
    }
  });
  await logAuditAction({
    action: "create",
    model: "asset",
    recordId: asset.id,
    recordName: asset.name,
    newValues: { name: data.name, originalValue: data.originalValue, categoryId: data.categoryId },
  });
  revalidatePath('/accounting/assets');
  return asset;
}

export async function updateAsset(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('asset', 'write');
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: data.name,
      originalValue: Number(data.originalValue),
      salvageValue: Number(data.salvageValue || 0),
      date: new Date(data.date),
      categoryId: data.categoryId,
      duration: parseInt(data.duration) || 5
    }
  });
  await logAuditAction({
    action: "update",
    model: "asset",
    recordId: asset.id,
    recordName: asset.name,
    newValues: { name: data.name, originalValue: data.originalValue, salvageValue: data.salvageValue },
  });
  revalidatePath(`/accounting/assets/${id}`);
  return asset;
}
export async function computeDepreciation(assetId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const asset = await prisma.asset.findUnique({
    where: {
      id: assetId
    },
    include: {
      category: true
    }
  });
  if (!asset) throw new Error("Asset not found");
  if (asset.state !== 'draft' && asset.state !== 'open') throw new Error("Cannot compute closed asset");
  prisma.assetLine.deleteMany({
    where: {
      assetId,
      posted: false
    }
  });
  const lines = [];
  const duration = asset.duration || 5;
  const originalValue = new Decimal(asset.originalValue || 0);
  const salvageValue = new Decimal(asset.salvageValue || 0);
  const value = originalValue.minus(salvageValue);
  const amountPerYear = value.div(duration);
  let currentDate = new Date(asset.date);
  let cumulative = new Decimal(0);
  for (let i = 1; i <= duration; i++) {
    new Date(currentDate);
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    cumulative = cumulative.plus(amountPerYear);
    const remaining = value.minus(cumulative);
    lines.push({
      assetId,
      date: currentDate,
      amount: amountPerYear,
      depreciated: cumulative,
      remaining: remaining.gt(0) ? remaining : new Decimal(0),
      posted: false
    });
  }
  await prisma.assetLine.createMany({
    data: lines
  });
  if (asset.state === 'draft') {
    await prisma.asset.update({
      where: {
        id: assetId
      },
      data: {
        state: 'open'
      }
    });
  }
  await logAuditAction({
    action: "depreciate",
    model: "asset",
    recordId: assetId,
    recordName: asset.name,
    newValues: { state: 'open', linesGenerated: lines.length },
  });
  revalidatePath(`/accounting/assets/${assetId}`);
}
export async function postAssetLine(lineId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const line = await prisma.assetLine.findUnique({
    where: {
      id: lineId
    },
    include: {
      asset: {
        include: {
          category: true
        }
      }
    }
  });
  if (!line || line.posted) return;
  const asset = line.asset;
  const category = asset.category;
  if (!category) throw new Error("Asset Category required for posting (Accounts needed)");
  if (!category.accountDeprId || !category.accountExpenseId || !category.journalId) {
    throw new Error("Category Configuration Missing (Accounts/Journal)");
  }
  const entry = await prisma.journalEntry.create({
    data: {
      name: `DEPR/${asset.name}/${new Date(line.date).getFullYear()}`,
      date: line.date,
      journalId: category.journalId,
      ref: `Depreciation of ${asset.name}`,
      state: 'posted',
      items: {
        create: [{
          accountId: category.accountExpenseId,
          name: `Depreciation - ${asset.name}`,
          debit: line.amount,
          credit: 0
        }, {
          accountId: category.accountDeprId,
          name: `Accumulated Depr - ${asset.name}`,
          debit: 0,
          credit: line.amount
        }]
      }
    }
  });
  await prisma.assetLine.update({
    where: {
      id: lineId
    },
    data: {
      posted: true,
      moveId: entry.id
    }
  });
  await prisma.asset.update({
    where: {
      id: asset.id
    },
    data: {
      bookValue: line.remaining
    }
  });
  await logAuditAction({
    action: "validate",
    model: "asset",
    recordId: asset.id,
    recordName: asset.name,
    newValues: { lineId, bookValue: Number(line.remaining), entryId: entry.id },
  });
  revalidatePath(`/accounting/assets/${asset.id}`);
}
export async function getAssetCategory(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === 'new') return null;
  return await prisma.assetCategory.findUnique({
    where: {
      id
    },
    include: {
      accountAsset: true,
      accountDepr: true,
      accountExpense: true,
      journal: true
    }
  });
}
export async function createAssetCategory(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('asset', 'create');
  const category = await prisma.assetCategory.create({
    data: {
      name: data.name,
      method: data.method || 'linear',
      duration: parseInt(data.duration) || 5,
      accountAssetId: data.accountAssetId,
      accountDeprId: data.accountDeprId,
      accountExpenseId: data.accountExpenseId,
      journalId: data.journalId,
      companyId: (await getCompanyId())!
    }
  });
  await logAuditAction({
    action: "create",
    model: "assetCategory",
    recordId: category.id,
    recordName: category.name,
    newValues: { name: data.name, method: data.method || 'linear', duration: data.duration },
  });
  revalidatePath('/accounting/configuration/asset_categories');
  return category;
}
export async function updateAssetCategory(id: string, data: any) {
  await ensureAccess('asset', 'write');
  const category = await prisma.assetCategory.update({
    where: {
      id
    },
    data: {
      name: data.name,
      method: data.method,
      duration: parseInt(data.duration),
      accountAssetId: data.accountAssetId,
      accountDeprId: data.accountDeprId,
      accountExpenseId: data.accountExpenseId,
      journalId: data.journalId
    }
  });
  await logAuditAction({
    action: "update",
    model: "assetCategory",
    recordId: category.id,
    recordName: category.name,
    newValues: { name: data.name, method: data.method, duration: data.duration },
  });
  revalidatePath('/accounting/configuration/asset_categories');
  return category;
}
export async function deleteAssetCategory(id: string) {
  await ensureAccess('asset', 'unlink');
  await prisma.assetCategory.delete({
    where: {
      id
    }
  });
  await logAuditAction({
    action: "delete",
    model: "assetCategory",
    recordId: id,
    recordName: "",
  });
  revalidatePath('/accounting/configuration/asset_categories');
}