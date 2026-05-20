"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { generateStockMoveEntry } from './accounting';
export async function getInventoryAdjustments() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  var session = await getSession();
  if (!session) return [];
  return await prisma.inventoryAdjustmentRecord.findMany({
    where: {
      companyId: session.companyId
    },
    include: {
      user: true,
      warehouse: true
    },
    orderBy: {
      date: 'desc'
    }
  });
}
export async function getInventoryAdjustment(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  var session = await getSession();
  if (!session) return null;
  return await prisma.inventoryAdjustmentRecord.findUnique({
    where: {
      id,
      companyId: session.companyId
    },
    include: {
      lines: {
        include: {
          product: true,
          location: true
        }
      },
      user: true,
      warehouse: true
    }
  });
}
export async function createInventoryAdjustment(data: {
  warehouseId?: string;
  notes?: string;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const count = await prisma.inventoryAdjustmentRecord.count({
      where: {
        companyId: session.companyId,
        date: {
          gte: new Date(new Date().getFullYear(), 0, 1)
        }
      }
    });
    const record = await prisma.inventoryAdjustmentRecord.create({
      data: {
        name: `INV/${new Date().getFullYear()}/${String(count + 1).padStart(3, '0')}`,
        warehouseId: data.warehouseId || null,
        notes: data.notes || '',
        userId: session.user.id,
        companyId: session.companyId,
        status: 'draft'
      }
    });
    revalidatePath('/[locale]/inventory/adjustments');
    return record;
  } catch (e: any) {
    throw new Error(e.message);
  }
}
export async function fetchProductsForAdjustment(recordId: string, categoryId?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const record = await prisma.inventoryAdjustmentRecord.findUnique({
      where: {
        id: recordId
      }
    });
    if (!record || record.status === 'locked') throw new Error("لا يمكن تعديل محضر مقفل");
    const whereArgs: any = {
      companyId: session.companyId,
      type: 'storable'
    };
    if (categoryId) {
      whereArgs.categoryId = categoryId;
    }
    const products = await prisma.product.findMany({
      where: whereArgs
    });
    const locations = await prisma.location.findMany({
      where: {
        type: 'internal',
        NOT: [{
          name: {
            endsWith: 'Input'
          }
        }, {
          name: {
            endsWith: 'Output'
          }
        }],
        OR: [{
          companyId: session.companyId
        }, {
          companyId: null
        }]
      }
    });
    for (const product of products) {
      for (const loc of locations) {
        const quant = await prisma.stockQuant.findFirst({
          where: {
            productId: product.id,
            locationId: loc.id
          }
        });
        const bookQty = quant ? Number(quant.quantity) : 0;
        const existingLine = await prisma.inventoryAdjustmentLine.findFirst({
          where: {
            recordId,
            productId: product.id,
            locationId: loc.id
          }
        });
        if (!existingLine) {
          await prisma.inventoryAdjustmentLine.create({
            data: {
              recordId,
              productId: product.id,
              locationId: loc.id,
              bookQty,
              actualQty: bookQty
            }
          });
        }
      }
    }
    revalidatePath(`/[locale]/inventory/adjustments/${recordId}`);
    return {
      success: true
    };
  } catch (e: any) {
    throw new Error(e.message);
  }
}
export async function updateAdjustmentLine(lineId: string, actualQty: number) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    const line = await prisma.inventoryAdjustmentLine.findUnique({
      where: {
        id: lineId
      },
      include: {
        record: true
      }
    });
    if (!line) throw new Error("Line not found");
    if (line.record.status === 'locked') throw new Error("لا يمكن التعديل على محضر مقفل");
    const diffQty = actualQty - Number(line.bookQty);
    await prisma.inventoryAdjustmentLine.update({
      where: {
        id: lineId
      },
      data: {
        actualQty,
        diffQty
      }
    });
    return {
      success: true
    };
  } catch (e: any) {
    throw new Error(e.message);
  }
}
export async function validateInventoryAdjustment(recordId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  try {
    return await prisma.$transaction(async (tx: any) => {
      const record = await tx.inventoryAdjustmentRecord.findUnique({
        where: {
          id: recordId
        },
        include: {
          lines: {
            include: {
              product: true
            }
          }
        }
      });
      if (!record) throw new Error("Record not found");
      if (record.status === 'locked') throw new Error("محضر الجرد مقفل بالفعل");
      const diffLines = record.lines.filter((l: any) => Number(l.diffQty) !== 0);
      let adjLoc = await tx.location.findFirst({
        where: {
          type: 'inventory_loss',
          companyId: session.companyId
        }
      });
      if (!adjLoc) {
        adjLoc = await tx.location.create({
          data: {
            name: 'Inventory Adjustment',
            type: 'inventory_loss',
            companyId: session.companyId
          }
        });
      }
      for (const line of diffLines) {
        const diff = Number(line.diffQty);
        const isSurplus = diff > 0;
        const sourceLocId = isSurplus ? adjLoc.id : line.locationId;
        const destLocId = isSurplus ? line.locationId : adjLoc.id;
        const move = await tx.stockMove.create({
          data: {
            companyId: session.companyId,
            productId: line.productId,
            quantity: Math.abs(diff),
            quantityDone: Math.abs(diff),
            status: 'done',
            name: `جرد مجمع: ${record.name}`,
            reference: `جرد مجمع: ${record.name}`,
            sourceLocationId: sourceLocId,
            destLocationId: destLocId,
            date: new Date(),
            unitName: line.uom || 'قطعة'
          }
        });
        const quant = await tx.stockQuant.findFirst({
          where: {
            productId: line.productId,
            locationId: line.locationId
          }
        });
        if (quant) {
          await tx.stockQuant.update({
            where: {
              id: quant.id
            },
            data: {
              quantity: Number(line.actualQty)
            }
          });
        } else {
          await tx.stockQuant.create({
            data: {
              companyId: session.companyId,
              locationId: line.locationId,
              productId: line.productId,
              quantity: Number(line.actualQty)
            }
          });
        }
        const cost = Number(line.product.costPrice || 0);
        const totalVal = Math.abs(diff) * cost;
        if (totalVal > 0) {
          let inventoryAccount = line.product.propertyAccountExpenseId;
          if (!inventoryAccount) {
            const defaultAcc = await tx.account.findFirst({
              where: {
                companyId: session.companyId,
                code: '103029'
              }
            });
            inventoryAccount = defaultAcc?.id;
          }
          let adjAccount = await tx.account.findFirst({
            where: {
              companyId: session.companyId,
              code: '103039'
            }
          });
          if (!adjAccount) {
            adjAccount = await tx.account.findFirst({
              where: {
                companyId: session.companyId,
                code: '500000'
              }
            });
          }
          if (inventoryAccount && adjAccount) {
            const journal = await tx.journal.findFirst({
              where: {
                companyId: session.companyId,
                type: 'general'
              }
            });
            if (journal) {
              const entry = await tx.journalEntry.create({
                data: {
                  name: `تسوية جرد مجمع - ${record.name} - ${line.product.name}`,
                  companyId: session.companyId,
                  journalId: journal.id,
                  date: new Date(),
                  ref: `تسوية جرد مجمع - ${record.name} - ${line.product.name}`,
                  state: 'posted'
                }
              });
              await tx.journalItem.create({
                data: {
                  entryId: entry.id,
                  accountId: isSurplus ? inventoryAccount : adjAccount.id,
                  debit: totalVal,
                  credit: 0,
                  name: `تحديث كمية - ${line.product.name}`
                }
              });
              await tx.journalItem.create({
                data: {
                  entryId: entry.id,
                  accountId: isSurplus ? adjAccount.id : inventoryAccount,
                  debit: 0,
                  credit: totalVal,
                  name: `تحديث كمية - ${line.product.name}`
                }
              });
            }
          }
        }
      }
      await tx.inventoryAdjustmentRecord.update({
        where: {
          id: recordId
        },
        data: {
          status: 'active',
          lockedAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      });
      return {
        success: true
      };
    });
  } catch (e: any) {
    throw new Error(e.message);
  }
}