"use server";

import prisma from '@/lib/prisma';
import { getCompanyPrisma } from '@/lib/prismaCompany';
import { getSession } from '@/lib/auth';
import { validateAccess } from '@/lib/security';
import { logTrackingChanges } from "@/app/actions/chatter";
import { logAuditAction } from "@/app/actions/audit";
import { ensureAccess } from '@/lib/access';
import { customAlphabet } from "nanoid";
const safeReturn = (data: any) => JSON.parse(JSON.stringify(data));
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Decimal } from '@prisma/client/runtime/library';
import { generateStockMoveEntryV2 as generateStockMoveEntry } from './accounting';
import { safeDecimal } from '@/lib/utils/numberUtils';
import { CreateProductSchema, CreateCategorySchema, CreateUomSchema, validateSafe } from '@/lib/validations';
export async function reserveStock(tx: any, companyId: string, productId: string, locationId: string, qtyToReserve: Decimal): Promise<Decimal> {
  if (qtyToReserve.lte(0)) return new Decimal(0);
  const quant = await tx.stockQuant.findFirst({
    where: {
      companyId,
      productId,
      locationId
    }
  });
  if (!quant) return new Decimal(0);
  const availableToReserve = new Decimal(quant.quantity).minus(new Decimal(quant.reservedQty));
  if (availableToReserve.lte(0)) return new Decimal(0);
  const actualReservation = Decimal.min(availableToReserve, qtyToReserve);
  await tx.stockQuant.update({
    where: {
      id: quant.id
    },
    data: {
      reservedQty: new Decimal(quant.reservedQty).plus(actualReservation)
    }
  });
  return actualReservation;
}
export async function releaseReservedStock(tx: any, companyId: string, productId: string, locationId: string, qtyToRelease: Decimal): Promise<void> {
  if (qtyToRelease.lte(0)) return;
  const quant = await tx.stockQuant.findFirst({
    where: {
      companyId,
      productId,
      locationId
    }
  });
  if (!quant) return;
  const newReservedQty = Decimal.max(0, new Decimal(quant.reservedQty).minus(qtyToRelease));
  await tx.stockQuant.update({
    where: {
      id: quant.id
    },
    data: {
      reservedQty: newReservedQty
    }
  });
}
export async function createInternalTransfer(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  const sourceLocationId = formData.get('sourceLocationId') as string;
  const destLocationId = formData.get('destLocationId') as string;
  const productIds = formData.getAll('productId') as string[];
  const quantities = formData.getAll('quantity') as string[];
  const unitSelections = formData.getAll('unitSelection') as string[];
  if (!sourceLocationId || !destLocationId || productIds.length === 0) {
    return {
      error: 'Please fill in all fields'
    };
  }
  try {
    const moveIds: string[] = [];
    await prisma.$transaction(async tx => {
      const intCount = await tx.stockPicking.count({
        where: {
          pickingType: 'INTERNAL',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });
      const picking = await tx.stockPicking.create({
        data: {
          name: `WH/INT/${String(intCount + 1).padStart(5, '0')}`,
          companyId: session.companyId,
          pickingType: 'INTERNAL',
          locationId: sourceLocationId,
          locationDestId: destLocationId,
          partnerId: null,
          status: 'done',
          scheduledDate: new Date(),
          origin: 'Manual Transfer'
        }
      });
      for (let i = 0; i < productIds.length; i++) {
        const baseProductId = productIds[i];
        const inputQtyRaw = new Decimal(quantities[i]);
        const unitSelection = unitSelections[i] || 'primary';
        if (!baseProductId || inputQtyRaw.lte(0)) continue;
        const baseProduct = await tx.product.findUnique({
          where: {
            id: baseProductId
          },
          include: {
            boms: {
              include: {
                lines: {
                  include: {
                    component: true
                  }
                }
              }
            }
          }
        });
        const isSecondary = unitSelection === 'secondary' && baseProduct?.hasSecondaryUnit;
        const uomFactor = isSecondary ? new Decimal(baseProduct?.secondaryUomFactor || 1) : new Decimal(1);
        const inputQty = inputQtyRaw.mul(uomFactor);
        const prodAny = baseProduct as any;
        let itemsToMove = [{
          productId: baseProductId,
          qty: inputQty,
          secQty: isSecondary ? inputQtyRaw : new Decimal(0),
          secUnit: isSecondary ? baseProduct?.secondaryUom : null
        }];
        if (prodAny?.boms && prodAny.boms.length > 0 && prodAny.boms[0].type === 'kit') {
          const bom = prodAny.boms[0];
          itemsToMove = bom.lines.map((line: any) => ({
            productId: line.componentId,
            qty: inputQty.mul(new Decimal(line.quantity)),
            secQty: new Decimal(0),
            secUnit: null
          }));
        }
        for (const item of itemsToMove) {
          const productId = item.productId;
          const qty = item.qty;
          const move = await tx.stockMove.create({
            data: {
              companyId: session.companyId,
              pickingId: picking.id,
              productId: item.productId,
              quantity: item.qty,
              quantityDone: item.qty,
              sourceLocationId: sourceLocationId,
              destLocationId: destLocationId,
              status: 'done',
              name: `INV: ${picking.id}`,
              secQty: item.secQty || new Decimal(0),
              secUnitName: item.secUnit || null
            }
          });
          moveIds.push(move.id);
          const sourceQuant = await tx.stockQuant.findFirst({
            where: {
              companyId: session.companyId,
              locationId: sourceLocationId,
              productId: productId
            }
          });
          if (sourceQuant) {
            await tx.stockQuant.update({
              where: {
                id: sourceQuant.id
              },
              data: {
                quantity: new Decimal(sourceQuant.quantity).minus(qty)
              }
            });
          } else {
            await tx.stockQuant.create({
              data: {
                companyId: session.companyId,
                locationId: sourceLocationId,
                productId: productId,
                quantity: qty.negated()
              }
            });
          }
          const destQuant = await tx.stockQuant.findFirst({
            where: {
              companyId: session.companyId,
              locationId: destLocationId,
              productId: productId
            }
          });
          if (destQuant) {
            await tx.stockQuant.update({
              where: {
                id: destQuant.id
              },
              data: {
                quantity: new Decimal(destQuant.quantity).plus(qty)
              }
            });
          } else {
            await tx.stockQuant.create({
              data: {
                companyId: session.companyId,
                locationId: destLocationId,
                productId: productId,
                quantity: qty
              }
            });
          }
        }
      }
    });
    for (const moveId of moveIds) {
      await generateStockMoveEntry(moveId);
    }
    await logAuditAction({
      action: "create",
      model: "picking",
      recordId: moveIds[0] || "",
      recordName: "Internal Transfer",
      newValues: { sourceLocationId, destLocationId, productsCount: productIds.length },
    });
    revalidatePath('/[locale]/inventory/transfers');
  } catch (error) {
    console.error('Transfer error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create transfer'
    };
  }
  redirect(`/${session.locale || 'ar'}/inventory/transfers`);
}
export async function createInventoryAdjustment(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  const locationId = formData.get('locationId') as string;
  const productIds = formData.getAll('productId') as string[];
  const realQuantities = formData.getAll('realQuantity') as string[];
  if (!locationId || productIds.length === 0) {
    return {
      error: 'Please select location and products'
    };
  }
  try {
    const moveIds: string[] = [];
    await prisma.$transaction(async tx => {
      const operations = productIds.map(async (productId, i) => {
        const realQty = new Decimal(realQuantities[i]);
        const quant = await tx.stockQuant.findFirst({
          where: {
            productId,
            locationId,
            lotId: null
          }
        });
        const currentQty = quant ? new Decimal(quant.quantity) : new Decimal(0);
        const diff = realQty.minus(currentQty);
        if (diff.isZero()) return;
        const move = await tx.stockMove.create({
          data: {
            companyId: session.companyId,
            name: `INV-ADJ: ${new Date().toISOString()}`,
            productId: productId,
            quantity: diff.abs(),
            quantityDone: diff.abs(),
            sourceLocationId: diff.isNegative() ? locationId : null,
            destLocationId: diff.isPositive() ? locationId : null,
            status: 'done'
          }
        });
        moveIds.push(move.id);
        if (quant) {
          await tx.stockQuant.update({
            where: {
              id: quant.id
            },
            data: {
              quantity: realQty
            }
          });
        } else {
          await tx.stockQuant.create({
            data: {
              companyId: session.companyId,
              locationId: locationId,
              productId: productId,
              quantity: realQty
            }
          });
        }
      });
      await Promise.all(operations);
    });
    for (const moveId of moveIds) {
      await generateStockMoveEntry(moveId);
    }
    revalidatePath('/[locale]/inventory/adjustments');
  } catch (error) {
    console.error('Adjustment error:', error);
    return {
      error: 'Failed to create adjustment'
    };
  }
  redirect(`/${session.locale || 'ar'}/inventory/adjustments`);
}
import { ValidatePickingSchema, validateOrThrow } from '@/lib/validations';

export async function validatePicking(pickingId: string, movesData?: any[], backorderAction: 'create' | 'cancel' | 'none' = 'none') {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");

  validateOrThrow(ValidatePickingSchema, { pickingId, backorderAction });

  try {
    const result = await prisma.$transaction(async tx => {
      const picking = await tx.stockPicking.findUnique({
        where: {
          id: pickingId
        },
        include: {
          moves: true
        }
      });
      if (!picking) throw new Error('Picking not found');
      if (picking.status === 'done' && backorderAction !== 'none') {
        throw new Error('CONCURRENCY_ERROR');
      }
      if (picking.status === 'done') {
        if (picking.saleOrderId) {
          const postedInvoice = await tx.invoice.findFirst({
            where: {
              saleOrderId: picking.saleOrderId,
              state: 'posted'
            }
          });
          if (postedInvoice) {
            throw new Error(`STRICT_LOCK: لا يمكن تعديل إيصال المخزن لارتباطه بفاتورة مبيعات تم ترحيلها نهائياً (Posted). الرجاء الرجوع للحسابات أولاً.`);
          }
        }
        if (picking.purchaseOrderId) {
          const postedBill = await tx.invoice.findFirst({
            where: {
              purchaseOrderId: picking.purchaseOrderId,
              state: 'posted'
            }
          });
          if (postedBill) {
            throw new Error(`STRICT_LOCK: لا يمكن تعديل إيصال المخزن لارتباطه بفاتورة مشتريات تم ترحيلها نهائياً (Posted). الرجاء الرجوع للحسابات أولاً.`);
          }
        }
        if (!movesData || movesData.length === 0) return;
        for (const moveData of movesData) {
          if (!moveData.id) continue;
          const newQtyDone = new Decimal(moveData.qtyDone || 0);
          const move = await tx.stockMove.findUnique({
            where: {
              id: moveData.id
            }
          });
          if (!move) continue;
          const oldQtyDone = new Decimal(move.quantityDone);
          const diff = newQtyDone.minus(oldQtyDone);
          if (diff.isZero()) continue;
          await tx.stockMove.update({
            where: {
              id: move.id
            },
            data: {
              quantityDone: newQtyDone,
              quantity: newQtyDone
            }
          });
          if (picking.locationDestId && move.productId) {
            const destQuant = await tx.stockQuant.findFirst({
              where: {
                locationId: picking.locationDestId,
                productId: move.productId
              }
            });
            if (destQuant) {
              await tx.stockQuant.update({
                where: {
                  id: destQuant.id
                },
                data: {
                  quantity: new Decimal(destQuant.quantity).plus(diff)
                }
              });
            } else {
              await tx.stockQuant.create({
                data: {
                  companyId: session.companyId,
                  locationId: picking.locationDestId,
                  productId: move.productId,
                  quantity: diff
                }
              });
            }
          }
          if (picking.locationId && move.productId) {
            const sourceQuant = await tx.stockQuant.findFirst({
              where: {
                locationId: picking.locationId,
                productId: move.productId
              }
            });
            if (sourceQuant) {
              await tx.stockQuant.update({
                where: {
                  id: sourceQuant.id
                },
                data: {
                  quantity: new Decimal(sourceQuant.quantity).minus(diff)
                }
              });
            } else {
              await tx.stockQuant.create({
                data: {
                  companyId: session.companyId,
                  locationId: picking.locationId,
                  productId: move.productId,
                  quantity: diff.negated()
                }
              });
            }
          }
          if (move.purchaseLineId) {
            const isReturn = picking.name?.startsWith('RET/') || picking.pickingType === 'OUTGOING' || picking.pickingType === 'outgoing';
            const actionDiff = isReturn ? diff.negated() : diff;
            const pol = await tx.purchaseOrderLine.findUnique({
              where: {
                id: move.purchaseLineId
              }
            });
            if (pol) {
              await tx.purchaseOrderLine.update({
                where: {
                  id: move.purchaseLineId
                },
                data: {
                  qtyReceived: new Decimal(pol.qtyReceived).plus(actionDiff).toNumber()
                }
              });
            }
          }
          if (move.saleLineId) {
            const isReturn = picking.name?.startsWith('RET/') || picking.pickingType === 'INCOMING' || picking.pickingType === 'incoming';
            const actionDiff = isReturn ? diff.negated() : diff;
            const sol = await tx.saleOrderLine.findUnique({
              where: {
                id: move.saleLineId
              }
            });
            if (sol) {
              await tx.saleOrderLine.update({
                where: {
                  id: move.saleLineId
                },
                data: {
                  qtyDelivered: new Decimal(sol.qtyDelivered).plus(actionDiff).toNumber()
                }
              });
            }
          }
        }
        const updateDraftInvoice = async (orderId: string, modelType: 'sale' | 'purchase') => {
          const invoices = await tx.invoice.findMany({
            where: {
              [modelType === 'sale' ? 'saleOrderId' : 'purchaseOrderId']: orderId,
              state: 'draft'
            },
            include: {
              lines: true
            }
          });
          for (const invoice of invoices) {
            const orderLines = modelType === 'sale' ? await tx.saleOrderLine.findMany({
              where: {
                orderId
              }
            }) : await tx.purchaseOrderLine.findMany({
              where: {
                orderId
              }
            });
            let totalInvoiceQuantity = new Decimal(0);
            for (const ol of orderLines) {
              const totalDelivered = modelType === 'sale' ? new Decimal((ol as any).qtyDelivered || 0) : new Decimal((ol as any).qtyReceived || 0);
              const matchedInvLine = invoice.lines.find((il: any) => il.productId === ol.productId);
              if (matchedInvLine) {
                await tx.invoiceLine.update({
                  where: {
                    id: matchedInvLine.id
                  },
                  data: {
                    quantity: totalDelivered
                  }
                });
                totalInvoiceQuantity = totalInvoiceQuantity.plus(totalDelivered);
              }
            }
            const user = await tx.user.findUnique({
              where: {
                id: session.userId
              }
            });
            let messageBody = `تحديث آلي: قام أمين المخزن <b>${user?.name || 'النظام'}</b> بتعديل كميات الاستلام في الإذن <b>${picking.name}</b>. تم مزامنة الفاتورة المبدئية تلقائياً لتتطابق مع المخزون!`;
            if (totalInvoiceQuantity.isZero()) {
              messageBody = `🚨 تحذير هام: قام أمين المخزن <b>${user?.name || 'النظام'}</b> بتصفير جميع كميات الاستلام المرتبطة.<br><br><span style="color:red; font-weight:bold;">كميات هذه الفاتورة أصبحت صفر! لا يوجد ما يفوتر. يرجى مسح (حذف) هذا المستند نهائياً أو إلغائه لتنظيف القيود المحاسبية.</span>`;
            }
            await tx.message.create({
              data: {
                body: messageBody,
                type: 'notification',
                subject: 'تحديث الجرد المادي',
                invoiceId: invoice.id
              }
            });
          }
        };
        if (picking.saleOrderId) await updateDraftInvoice(picking.saleOrderId, 'sale');
        if (picking.purchaseOrderId) await updateDraftInvoice(picking.purchaseOrderId, 'purchase');
        return picking!;
      }

      let movesToProcess: any[] = [];
      if (!movesData) {
        movesToProcess = picking.moves.map((m: any) => ({
          id: m.id,
          qtyDone: new Decimal(m.quantity),
          productId: m.productId,
          secQtyDone: m.secQtyDone
        }));
      } else {
        movesToProcess = movesData.map(m => ({
          ...m,
          qtyDone: new Decimal(m.qtyDone || 0)
        }));
      }

      for (const moveData of movesToProcess) {
        const qtyDone = moveData.qtyDone as Decimal;
        const originalMove = picking.moves.find((m: any) => m.id === moveData.id);
        const finalDemandForCurrentMove = qtyDone;
        
        await tx.stockMove.update({
          where: {
            id: moveData.id
          },
          data: {
            quantityDone: qtyDone,
            secQtyDone: moveData.secQtyDone ? new Decimal(moveData.secQtyDone) : new Decimal(0),
            status: 'done'
          }
        });
        
        if (qtyDone.isZero()) continue;

        if (originalMove?.purchaseLineId) {
          const pol = await tx.purchaseOrderLine.findUnique({
            where: {
              id: originalMove.purchaseLineId
            }
          });
          if (pol && pol.productId === moveData.productId) {
            const isReturn = picking.name?.startsWith('RET/') || picking.pickingType === 'OUTGOING' || picking.pickingType === 'outgoing';
            const actionDiff = isReturn ? qtyDone.negated() : qtyDone;
            await tx.purchaseOrderLine.update({
              where: {
                id: pol.id
              },
              data: {
                qtyReceived: new Decimal(pol.qtyReceived || 0).plus(actionDiff).toNumber()
              }
            });
          }
        }
        if (originalMove?.saleLineId) {
          const sol = await tx.saleOrderLine.findUnique({
            where: {
              id: originalMove.saleLineId
            }
          });
          if (sol && sol.productId === moveData.productId) {
            const isReturn = picking.name?.startsWith('RET/') || picking.pickingType === 'INCOMING' || picking.pickingType === 'incoming';
            const actionDiff = isReturn ? qtyDone.negated() : qtyDone;
            await tx.saleOrderLine.update({
              where: {
                id: sol.id
              },
              data: {
                qtyDelivered: new Decimal(sol.qtyDelivered || 0).plus(actionDiff).toNumber()
              }
            });
          }
        }
        if (picking.locationId) {
          const sourceQuant = await tx.stockQuant.findFirst({
            where: {
              locationId: picking.locationId,
              productId: moveData.productId
            }
          });
          if (sourceQuant) {
            const currentQty = new Decimal(sourceQuant.quantity);
            const sourceLoc = await tx.location.findUnique({
              where: {
                id: picking.locationId
              }
            });
            const approval = await tx.approvalRequest.findFirst({
              where: {
                resourceId: pickingId,
                type: 'negative_stock'
              }
            });
            if (sourceLoc?.type === 'internal' && currentQty.lessThan(qtyDone)) {
              if (session.role === 'ADMIN') {} else if (approval && approval.status === 'approved') {} else if (!approval) {
                await tx.approvalRequest.create({
                  data: {
                    type: 'negative_stock',
                    status: 'pending',
                    requesterId: session.userId,
                    resourceId: pickingId,
                    resourceModel: 'StockPicking',
                    details: JSON.stringify({
                      productId: moveData.productId,
                      requestedQty: qtyDone.toNumber(),
                      availableQty: currentQty.toNumber(),
                      pickingName: picking.name
                    }),
                    companyId: session.companyId
                  }
                });
                throw new Error(`APPROVAL_REQUIRED: Product ${moveData.productId} has only ${currentQty} available, requested ${qtyDone}. Request sent to Manager.`);
              } else if (approval.status === 'pending') {
                throw new Error(`APPROVAL_PENDING: Request to issue negative stock is still pending manager approval.`);
              } else if (approval.status === 'rejected') {
                throw new Error(`APPROVAL_REJECTED: Manager rejected the negative stock request.`);
              }
            }
            const updated = await tx.stockQuant.updateMany({
              where: {
                id: sourceQuant.id,
                version: sourceQuant.version
              },
              data: {
                quantity: new Decimal(sourceQuant.quantity).minus(qtyDone),
                reservedQty: Decimal.max(0, new Decimal(sourceQuant.reservedQty).minus(qtyDone)),
                version: {
                  increment: 1
                }
              }
            });
            if (updated.count === 0) {
              throw new Error(`CONCURRENCY_ERROR: Stock changed during transaction for product ${moveData.productId}. Please retry.`);
            }
          } else {
            const approval = await tx.approvalRequest.findFirst({
              where: {
                resourceId: pickingId,
                type: 'negative_stock'
              }
            });
            const sourceLoc = await tx.location.findUnique({
              where: {
                id: picking.locationId
              }
            });
            if (sourceLoc?.type === 'internal') {
              if (session.role === 'ADMIN') {} else if (approval && approval.status === 'approved') {} else if (!approval) {
                await tx.approvalRequest.create({
                  data: {
                    type: 'negative_stock',
                    status: 'pending',
                    requesterId: session.userId,
                    resourceId: pickingId,
                    resourceModel: 'StockPicking',
                    details: JSON.stringify({
                      productId: moveData.productId,
                      requestedQty: qtyDone.toNumber(),
                      availableQty: 0,
                      pickingName: picking.name
                    }),
                    companyId: session.companyId
                  }
                });
                throw new Error(`APPROVAL_REQUIRED: No stock found for product ${moveData.productId}. Request sent to Manager.`);
              } else if (approval.status === 'pending') {
                throw new Error(`APPROVAL_PENDING: Request to issue negative stock is still pending manager approval.`);
              } else if (approval.status === 'rejected') {
                throw new Error(`APPROVAL_REJECTED: Manager rejected the negative stock request.`);
              }
            }
            await tx.stockQuant.create({
              data: {
                companyId: session.companyId,
                locationId: picking.locationId,
                productId: moveData.productId,
                quantity: qtyDone.negated(),
                version: 1
              }
            });
          }
        }
        if (picking.locationDestId) {
          const destQuant = await tx.stockQuant.findFirst({
            where: {
              locationId: picking.locationDestId,
              productId: moveData.productId
            }
          });
          if (destQuant) {
            await tx.stockQuant.update({
              where: {
                id: destQuant.id
              },
              data: {
                quantity: new Decimal(destQuant.quantity).plus(qtyDone),
                version: {
                  increment: 1
                }
              }
            });
          } else {
            await tx.stockQuant.create({
              data: {
                companyId: session.companyId,
                locationId: picking.locationDestId,
                productId: moveData.productId,
                quantity: qtyDone,
                version: 1
              }
            });
          }
        }
        if (picking.pickingType === 'INCOMING') {
          const product = await tx.product.findUnique({
            where: {
              id: moveData.productId
            },
            include: {
              category: true
            }
          });
          const costingMethod = (product as any)?.category?.costingMethod || 'standard';
          if (product && costingMethod === 'avco') {
            const allInternalQuants = await tx.stockQuant.findMany({
              where: {
                companyId: session.companyId,
                productId: product.id,
                location: {
                  type: 'internal'
                }
              }
            });
            const currentInternalQty = allInternalQuants.reduce((acc, q) => acc.plus(new Decimal(q.quantity)), new Decimal(0));
            const priorQty = Decimal.max(0, currentInternalQty.minus(qtyDone));
            const moveRecord = await tx.stockMove.findUnique({
              where: {
                id: moveData.id
              },
              include: {
                purchaseLine: true
              }
            });
            const incomingCost = moveRecord?.purchaseLine?.priceUnit ? new Decimal(moveRecord.purchaseLine.priceUnit) : new Decimal((product as any).costPrice);
            if (currentInternalQty.greaterThan(0)) {
              const currentCost = new Decimal((product as any).costPrice);
              const newCost = priorQty.isZero() || currentCost.isZero() ? incomingCost : priorQty.mul(currentCost).plus(qtyDone.mul(incomingCost)).div(currentInternalQty);
              await tx.product.update({
                where: {
                  id: product.id
                },
                data: {
                  costPrice: newCost
                }
              });
            }
          } else if (product && costingMethod === 'standard') {
            const currentCost = new Decimal((product as any).costPrice);
            if (currentCost.isZero()) {
              const moveRecord = await tx.stockMove.findUnique({
                where: {
                  id: moveData.id
                },
                include: {
                  purchaseLine: true
                }
              });
              const purchasePrice = moveRecord?.purchaseLine?.priceUnit ? new Decimal(moveRecord.purchaseLine.priceUnit) : new Decimal(0);
              if (purchasePrice.greaterThan(0)) {
                await tx.product.update({
                  where: {
                    id: product.id
                  },
                  data: {
                    costPrice: purchasePrice
                  }
                });
              }
            }
          }
        }
      }
      await tx.stockPicking.update({
        where: {
          id: pickingId
        },
        data: {
          status: 'done',
          dateDone: new Date()
        }
      });
      if (backorderAction === 'create') {
        const backorderMovesData = [];
        for (const moveData of movesToProcess) {
          const qtyDone = new Decimal(moveData.qtyDone || 0);
          const originalMove = picking.moves.find((m: any) => m.id === moveData.id);
          if (originalMove) {
            const demand = new Decimal(originalMove.quantity);
            if (qtyDone.lessThan(demand)) {
              const missingQty = demand.minus(qtyDone);
              backorderMovesData.push({
                originalMove,
                missingQty
              });
            }
          }
        }
        if (backorderMovesData.length > 0) {
          const backorderPicking = await tx.stockPicking.create({
            data: {
              name: `${picking.name} - Backorder`,
              origin: picking.origin,
              status: 'assigned'
            }
          });
          for (const boData of backorderMovesData) {
            const m = boData.originalMove;
            await tx.stockMove.create({
              data: {
                name: m.name,
                pickingId: backorderPicking.id,
                productId: m.productId,
                quantity: boData.missingQty,
                quantityDone: new Decimal(0),
                status: 'assigned',
                unitName: m.unitName,
                secQty: m.secQty ? new Decimal(m.secQty).mul(boData.missingQty).div(new Decimal(m.quantity)) : 0,
                secQtyDone: new Decimal(0),
                secUnitName: m.secUnitName,
                lotId: m.lotId,
                saleLineId: m.saleLineId,
                purchaseLineId: m.purchaseLineId,
                companyId: m.companyId
              }
            });
          }
        }
      }
      const stockJournal = await tx.journal.findFirst({
        where: {
          type: 'general'
        }
      });
      if (stockJournal && (picking.pickingType === 'INCOMING' || picking.pickingType === 'outgoing' || picking.pickingType === 'incoming' || picking.pickingType === 'OUTGOING')) {
        const getOrCreateAccount = async (type: string, name: string, code: string) => {
          let acc = await tx.account.findFirst({
            where: {
              type
            }
          });
          if (!acc) {
            acc = await tx.account.create({
              data: {
                name,
                code,
                type,
                companyId: session.companyId as string
              }
            });
          }
          return acc;
        };
        const stockAssetAccount = await getOrCreateAccount('current_assets', 'المخزون (أصل)', '103001');
        const stockInterimAccount = await getOrCreateAccount('current_assets', 'المخزون الوسيط (الوارد/المنصرف)', '103049');
        for (const moveData of movesToProcess) {
          const qtyDone = moveData.qtyDone as Decimal;
          if (qtyDone.isZero()) continue;
          const product = await tx.product.findUnique({
            where: {
              id: moveData.productId
            }
          });
          if (product && product.type === 'storable') {
            let unitCost = Number((product as any).costPrice || 0);
            if (picking.pickingType === 'INCOMING' || picking.pickingType === 'incoming') {
              const moveInfo = await tx.stockMove.findUnique({
                where: {
                  id: moveData.id
                },
                include: {
                  purchaseLine: true
                }
              });
              if (moveInfo?.purchaseLine?.priceUnit) {
                unitCost = Number(moveInfo.purchaseLine.priceUnit);
                unitCost = Number(moveInfo.purchaseLine.priceUnit);
              }
            }
            const totalValue = Number(qtyDone) * unitCost;
            if (totalValue > 0) {
              const journalItems = [];
              if (picking.pickingType === 'INCOMING' || picking.pickingType === 'incoming') {
              journalItems.push({
                accountId: stockInterimAccount.id,
                name: `${picking.name} - وسيط وارد`,
                debit: 0,
                credit: totalValue,
                productId: product.id
              });
            } else if (picking.pickingType === 'OUTGOING' || picking.pickingType === 'outgoing') {
            journalItems.push({
              accountId: stockAssetAccount.id,
              name: `${picking.name} - منصرف`,
              debit: 0,
              credit: totalValue,
              productId: product.id
            });
          }
          const jeCount = await tx.journalEntry.count({
            where: {
              journalId: stockJournal.id,
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          });
          const jeSeq = String(jeCount + 1).padStart(4, '0');
          const entry = await tx.journalEntry.create({
            data: {
              name: `${stockJournal.code}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${jeSeq}`,
              date: new Date(),
              journalId: stockJournal.id,
              partnerId: picking.partnerId,
              state: 'posted',
              companyId: session.companyId as string,
              items: {
                create: journalItems
              }
            }
          });
          await tx.stockMove.update({
            where: {
              id: moveData.id
            },
            data: {
              journalEntryId: entry.id
            }
          });
        }
      }
    }
    const movesNeedingBackorder = picking.moves.map(m => {
      const processData = movesToProcess.find((mp: any) => mp.id === m.id);
      const qtyDone = processData?.qtyDone || new Decimal(0);
      const originalQty = new Decimal(m.quantity);
      if (originalQty.greaterThan(qtyDone)) {
        return {
          move: m,
          qtyDone,
          remainder: originalQty.minus(qtyDone)
        };
      }
      return null;
    }).filter(Boolean) as any[];
    if (movesNeedingBackorder.length > 0) {
      ;
      const hasValidations = movesNeedingBackorder.some(i => i.qtyDone.greaterThan(0));
      const backorderPicking = await tx.stockPicking.create({
        data: {
          name: `${picking.name}-BO`,
          companyId: picking.companyId,
          pickingType: picking.pickingType as any,
          locationId: picking.locationId,
          locationDestId: picking.locationDestId,
          partnerId: picking.partnerId,
          status: 'assigned',
          origin: picking.origin,
          scheduledDate: picking.scheduledDate,
          backorderId: picking.id
        }
      });
      for (const item of movesNeedingBackorder) {
        if (item.qtyDone.greaterThan(0)) {
          await tx.stockMove.update({
            where: {
              id: item.move.id
            },
            data: {
              quantity: item.qtyDone
            }
          });
          await tx.stockMove.create({
            data: {
              name: item.move.name,
              companyId: item.move.companyId,
              pickingId: backorderPicking.id,
              productId: item.move.productId,
              quantity: item.remainder,
              quantityDone: new Decimal(0),
              sourceLocationId: item.move.sourceLocationId,
              destLocationId: item.move.destLocationId,
              status: 'assigned',
              unitName: item.move.unitName,
              saleLineId: item.move.saleLineId,
              purchaseLineId: item.move.purchaseLineId
            }
          });
        } else {
          await tx.stockMove.update({
            where: {
              id: item.move.id
            },
            data: {
              pickingId: backorderPicking.id,
              status: 'assigned'
            }
          });
        }
      }
      // let thelogicbelowfinish;
    }
    const user = await tx.user.findUnique({
      where: {
        id: session.userId
      }
    });
    await tx.message.create({
      data: {
        body: `قام <b>${user?.name || 'النظام'}</b> بتأكيد إذن المخزن وتحديث الكميات.`,
        type: 'notification',
        subject: user?.name || 'System',
        stockPickingId: picking.id
      }
    });
    if (picking.purchaseOrderId) {
      await tx.message.create({
        data: {
          body: `تم استلام البضائع بنجاح من إذن المخزن <b>${picking.name}</b>.`,
          type: 'notification',
          subject: user?.name || 'System',
          purchaseOrderId: picking.purchaseOrderId
        }
      });
      const po = await tx.purchaseOrder.findUnique({
        where: {
          id: picking.purchaseOrderId
        },
        include: {
          invoices: true
        }
      });
      if (po && po.invoices.length === 0) {
        await tx.message.create({
          data: {
            body: `⚠️ <b>تنبيه فوترة:</b> تم استلام بضاعة الطلب <b>${po.name}</b> (كلياً أو جزئياً) ولم تُصدر له أي فاتورة. يرجى إنشاء فاتورة المورد!`,
            type: 'notification',
            subject: 'تنبيه الفوترة',
            purchaseOrderId: po.id
          }
        });
        if (po.createdById) {
          await tx.notification.create({
            data: {
              userId: po.createdById,
              title: `تنبيه فوترة مشتريات`,
              message: `تم استلام بضاعة الطلب ${po.name}. يرجى إنشاء فاتورة المورد!`,
              type: 'WARNING',
              senderId: session.userId,
              linkUrl: `/ar/purchases/${po.id}`,
              resourceId: po.id,
              resourceModel: 'PurchaseOrder',
              companyId: session.companyId as string
            }
          });
        }
      }
    }
    if (picking.saleOrderId) {
      const so = await tx.saleOrder.findUnique({
        where: {
          id: picking.saleOrderId
        },
        include: {
          invoices: true
        }
      });
      if (so && so.invoices.length === 0) {
        await tx.message.create({
          data: {
            body: `⚠️ <b>تنبيه فوترة:</b> تم صرف بضاعة أمر البيع <b>${so.name}</b> للعميل ولم تُصدر له فاتورة. يرجى إنشاء الفاتورة!`,
            type: 'notification',
            subject: 'تنبيه الفوترة',
            saleOrderId: so.id
          }
        });
        if (so.createdById) {
          await tx.notification.create({
            data: {
              userId: so.createdById,
              title: `تنبيه فوترة مبيعات`,
              message: `تم صرف بضاعة أمر البيع ${so.name} للعميل ولم تُصدر له فاتورة. يرجى إنشاء الفاتورة!`,
              type: 'WARNING',
              senderId: session.userId,
              linkUrl: `/ar/sales/${so.id}`,
              resourceId: so.id,
              resourceModel: 'SaleOrder',
              companyId: session.companyId as string
            }
          });
        }
      }
      if (so?.createdById && so.createdById !== session.userId) {
        const warehouseUser = await tx.user.findUnique({
          where: {
            id: session.userId
          },
          select: {
            name: true
          }
        });
        await tx.notification.create({
          data: {
            userId: so.createdById,
            title: `✅ تم صرف البضاعة: ${so.name}`,
            message: `قام أمين المخزن ${warehouseUser?.name || 'النظام'} بتصديق خروج البضاعة لأمر البيع ${so.name}. يمكنك الآن إصدار الفاتورة للعميل.`,
            type: 'INFO',
            senderId: session.userId,
            linkUrl: `/ar/sales/${so.id}`,
            resourceId: so.id,
            resourceModel: 'SaleOrder',
            companyId: session.companyId
          }
        });
      }
    }
  }
    return { success: true };
  }, { timeout: 15000 });
  try {
    revalidatePath('/[locale]/inventory/operations');
  } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
  
  if (result && 'success' in result && result.success) {
    await logTrackingChanges('stockPicking', pickingId, [{
      fieldName: 'status',
      fieldDesc: 'الحالة',
      oldValue: 'قيد الانتظار/جاهز',
      newValue: 'منتهي'
    }]);
  }

  return result;
  } catch (error: any) {
    console.error('Validate Picking Error:', error);
    if (error.message.includes('CONCURRENCY_ERROR')) {
      return { error: 'CONCURRENCY_ERROR' };
    }
    if (error.message.includes('INSUFFICIENT_STOCK')) {
      return { error: error.message };
    }
    throw error;
  }
}
export async function createProduct(data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('product', 'create');
  const validation = validateSafe(CreateProductSchema, data);
  if (!validation.success) return {
    error: validation.error
  };
  try {
    const product = await prisma.$transaction(async tx => {
      let categoryId = data.categoryId || null;
      if (categoryId === 'All' || categoryId === 'all' || categoryId === '') {
        categoryId = null;
      }
      return await tx.product.create({
        data: {
          name: data.name,
          image: data.image,
          description: data.description || null,
          type: data.detailedType || 'consu',
          canBeSold: data.can_sell ?? true,
          canBePurchased: data.can_purchase ?? true,
          isPromotedForSale: data.isPromotedForSale ?? false,
          invoicingPolicy: data.invoicingPolicy || 'ordered',
          uom: data.uom,
          purchaseUom: data.purchaseUom,
          hasSecondaryUnit: data.hasSecondaryUnit,
          secondaryUom: data.secondaryUom,
          secondaryUomFactor: Number(safeDecimal(data.secondaryUomFactor, 1.0)),
          salePrice: Number(safeDecimal(data.salePrice)),
          costPrice: Number(safeDecimal(data.costPrice)),
          taxes: Number(safeDecimal(data.taxes)),
          internalReference: data.internalReference || null,
          barcode: data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null,
          manufacturer: data.manufacturer || null,
          categoryId: categoryId,
          detailedType: data.detailedType || 'consu',
          descriptionSale: data.descriptionSale,
          tags: {
            connect: (data.tags || []).filter((t: string) => t && t !== '').map((t: string) => ({
              id: t
            }))
          },
          attributeLines: {
            create: (data.attributeLines || []).filter((line: any) => line.attributeId && line.attributeId !== '' && line.valueIds?.length > 0).map((line: any) => ({
              attributeId: line.attributeId,
              values: {
                connect: line.valueIds.map((id: string) => ({
                  id
                }))
              }
            }))
          },
          routeBuy: data.routeBuy === 'on' || data.routeBuy === true,
          routeMto: data.routeMto === 'on' || data.routeMto === true,
          weight: safeDecimal(data.weight) as any,
          volume: safeDecimal(data.volume) as any,
          hsCode: data.hsCode || null,
          countryOfOrigin: data.countryOfOrigin || null,
          saleDelay: parseInt(data.saleDelay || 0),
          produceDelay: parseInt(data.produceDelay || 0),
          route: data.route,
          tracking: data.tracking || 'none',
          descriptionPicking: data.descriptionPicking || null,
          descriptionPickingout: data.descriptionPickingout || null,
          incomeAccount: data.incomeAccount || null,
          expenseAccount: data.expenseAccount || null,
          assetType: data.assetType || null,
          priceDifferenceAccount: data.priceDifferenceAccount || null,
          propertyAccountIncomeId: data.propertyAccountIncomeId || null,
          propertyAccountExpenseId: data.propertyAccountExpenseId || null,
          companyId: session.companyId,
          createdById: session.userId,
          updatedById: session.userId,
          supplierInfo: {
            create: (data.supplierInfo || []).filter((s: any) => s.partnerId && s.partnerId !== '').map((s: any) => ({
              partnerId: s.partnerId,
              price: new Decimal(s.price || 0),
              minQty: new Decimal(s.minQty || 0),
              delay: parseInt(s.delay || 0),
              productCode: s.productCode
            }))
          },
          boms: data.boms && data.boms.length > 0 ? {
            create: [{
              type: 'kit',
              lines: {
                create: data.boms.map((bomLine: any) => ({
                  componentId: bomLine.componentId,
                  quantity: new Decimal(bomLine.quantity || 1),
                  uom: bomLine.uom || ''
                }))
              }
            }]
          } : undefined
        }
      });
    });
    if (product && (product as any).attributeLines && (product as any).attributeLines.length > 0) {
      await generateVariants(product.id);
    }
    await logAuditAction({
      action: "create",
      model: "product",
      recordId: product.id,
      recordName: product.name,
      newValues: { name: data.name, type: data.detailedType, salePrice: data.salePrice, costPrice: data.costPrice },
    });
    revalidatePath('/', 'layout');
    return safeReturn(product);
  } catch (e) {
    console.error("Failed to create product", e);
    throw e;
  }
}
export async function createCategory(data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const validation = validateSafe(CreateCategorySchema, data);
  if (!validation.success) return {
    error: validation.error
  };
  await ensureAccess('product', 'create');
  try {
    const category = await prisma.productCategory.create({
      data: {
        name: data.name,
        parentId: data.parentId || null,
        costingMethod: data.costingMethod || 'standard',
        valuation: data.valuation || 'manual_periodic',
        propertyStockAccountId: data.propertyStockAccountId || null,
        propertyStockAccountInputId: data.propertyStockAccountInputId || null,
        propertyStockAccountOutputId: data.propertyStockAccountOutputId || null,
        propertyStockJournalId: data.propertyStockJournalId || null,
        propertyAccountIncomeId: data.propertyAccountIncomeId || null,
        propertyAccountExpenseId: data.propertyAccountExpenseId || null
      }
    });
    await logAuditAction({
      action: "create",
      model: "productCategory",
      recordId: category.id,
      recordName: category.name,
      newValues: { name: data.name, costingMethod: data.costingMethod },
    });
    try {
      revalidatePath('/', 'layout');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return safeReturn(category);
  } catch (e) {
    console.error("Failed to create category", e);
    throw e;
  }
}
export async function updateCategory(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('product', 'write');
  try {
    const category = await prisma.productCategory.update({
      where: {
        id
      },
      data: {
        name: data.name,
        parentId: data.parentId || null,
        costingMethod: data.costingMethod || 'standard',
        valuation: data.valuation || 'manual_periodic',
        propertyStockAccountId: data.propertyStockAccountId || null,
        propertyStockAccountInputId: data.propertyStockAccountInputId || null,
        propertyStockAccountOutputId: data.propertyStockAccountOutputId || null,
        propertyStockJournalId: data.propertyStockJournalId || null,
        propertyAccountIncomeId: data.propertyAccountIncomeId || null,
        propertyAccountExpenseId: data.propertyAccountExpenseId || null
      }
    });
    await logAuditAction({
      action: "update",
      model: "productCategory",
      recordId: category.id,
      recordName: category.name,
      newValues: { name: data.name, costingMethod: data.costingMethod },
    });
    try {
      revalidatePath('/', 'layout');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return safeReturn(category);
  } catch (e) {
    console.error("Failed to update category", e);
    throw e;
  }
}
export async function deleteProduct(id: string) {
  await ensureAccess('product', 'unlink');
  try {
    const [saleLines, purchaseLines, invoiceLines, stockMoves, stockQuants, journalItems] = await Promise.all([prisma.saleOrderLine.count({
      where: {
        productId: id
      }
    }), prisma.purchaseOrderLine.count({
      where: {
        productId: id
      }
    }), prisma.invoiceLine.count({
      where: {
        productId: id
      }
    }), prisma.stockMove.count({
      where: {
        productId: id
      }
    }), prisma.stockQuant.count({
      where: {
        productId: id
      }
    }), prisma.journalItem.count({
      where: {
        productId: id
      }
    })]);
    if (saleLines > 0 || purchaseLines > 0 || invoiceLines > 0 || stockMoves > 0 || journalItems > 0) {
      const reasons: string[] = [];
      if (saleLines > 0) reasons.push(`${saleLines} بند مبيعات`);
      if (purchaseLines > 0) reasons.push(`${purchaseLines} بند مشتريات`);
      if (invoiceLines > 0) reasons.push(`${invoiceLines} بند فاتورة`);
      if (stockMoves > 0) reasons.push(`${stockMoves} حركة مخزنية`);
      if (journalItems > 0) reasons.push(`${journalItems} قيد محاسبي`);
      return {
        error: `لا يمكن حذف المنتج لارتباطه بـ: ${reasons.join('، ')}. يرجى أرشفته بدلاً من ذلك.`
      };
    }
    prisma.$transaction(async tx => {
      await tx.productAttributeLine.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.productSupplierInfo.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.stockQuant.deleteMany({
        where: {
          productId: id
        }
      });
      const boms = await tx.billOfMaterial.findMany({
        where: {
          productId: id
        }
      });
      for (const bom of boms) {
        await tx.bOMLine.deleteMany({
          where: {
            bomId: bom.id
          }
        });
      }
      await tx.billOfMaterial.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.bOMLine.deleteMany({
        where: {
          componentId: id
        }
      });
      await tx.product.deleteMany({
        where: {
          templateId: id
        }
      });
      await tx.message.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.attachment.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.stockPutawayRule.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.stockReplenishment.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.productTax.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.priceListItem.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.saleOrderOption.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.stockScrap.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.stockLot.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.stockValuationLayer.deleteMany({
        where: {
          productId: id
        }
      });
      await tx.product.delete({
        where: {
          id
        }
      });
    });
    await logAuditAction({
      action: "delete",
      model: "product",
      recordId: id,
      recordName: "",
    });
    revalidatePath('/', 'layout');
    return {
      success: true
    };
  } catch (e: any) {
    console.error("Failed to delete product", e);
    if (e.code === 'P2003' || e.message?.includes('Foreign key constraint')) {
      return {
        error: 'لا يمكن حذف المنتج لارتباطه بسجلات أخرى. يرجى أرشفته بدلاً من ذلك.'
      };
    }
    return {
      error: 'حدث خطأ أثناء محاولة حذف المنتج.'
    };
  }
}
export async function archiveProduct(id: string, active: boolean) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    await prisma.product.update({
      where: {
        id
      },
      data: {
        active
      }
    });
    await logAuditAction({
      action: active ? "update" : "update",
      model: "product",
      recordId: id,
      recordName: "",
      newValues: { active, action: active ? "unarchive" : "archive" },
    });
    revalidatePath('/', 'layout');
    revalidatePath(`/[locale]/inventory/products/${id}`);
    return {
      success: true
    };
  } catch (e) {
    console.error("Failed to archive product", e);
    throw e;
  }
}
export async function duplicateProduct(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const original = await prisma.product.findUnique({
      where: {
        id
      }
    });
    if (!original) throw new Error("Product not found");
    const {
      id: _,
      odooId,
      createdAt,
      updatedAt,
      ...data
    } = original;
    const newProduct = await prisma.product.create({
      data: {
        ...data,
        name: `${data.name} (نسخة)`,
        active: true
      }
    });
    await logAuditAction({
      action: "create",
      model: "product",
      recordId: newProduct.id,
      recordName: newProduct.name,
      newValues: { duplicatedFrom: id },
    });
    revalidatePath('/', 'layout');
    return newProduct;
  } catch (e) {
    console.error("Failed to duplicate product", e);
    throw e;
  }
}
export async function getProductCategories() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const categories = await prisma.productCategory.findMany({
      where: {
        OR: [
          { companyId: session.companyId },
          { companyId: null }
        ]
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        parent: true
      }
    });
    return categories;
  } catch (e) {
    console.error(e);
    return [];
  }
}
export async function getPartners() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  const cprisma = await getCompanyPrisma();
  try {
    const partners = await cprisma.partner.findMany({
      where: {
        isVendor: true
      },
      select: { id: true, name: true }
    });
    return partners.map(p => ({
      value: p.id,
      label: p.name
    }));
  } catch (e) {
    return [];
  }
}
export async function getProductMetrics(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const sold = await prisma.saleOrderLine.aggregate({
      where: {
        productId
      },
      _sum: {
        quantity: true
      }
    });
    const purchased = await prisma.purchaseOrderLine.aggregate({
      where: {
        productId
      },
      _sum: {
        quantity: true
      }
    });
    const onHand = await prisma.stockQuant.aggregate({
      where: {
        productId,
        location: {
          type: 'internal'
        }
      },
      _sum: {
        quantity: true
      }
    });
    const incoming = await prisma.stockMove.aggregate({
      where: {
        productId,
        destLocation: {
          type: 'internal'
        },
        sourceLocation: {
          type: {
            not: 'internal'
          }
        },
        status: {
          not: 'done'
        }
      },
      _sum: {
        quantity: true
      }
    });
    const outgoing = await prisma.stockMove.aggregate({
      where: {
        productId,
        sourceLocation: {
          type: 'internal'
        },
        destLocation: {
          type: {
            not: 'internal'
          }
        },
        status: {
          not: 'done'
        }
      },
      _sum: {
        quantity: true
      }
    });
    const variantsCount = await prisma.product.count({
      where: {
        templateId: productId
      }
    });
    const journalItemsCount = await prisma.journalItem.count({
      where: {
        productId
      }
    });
    const revenueLines = await prisma.invoiceLine.aggregate({
      where: {
        productId,
        invoice: {
          type: 'out_invoice',
          state: {
            in: ['posted', 'paid']
          }
        }
      },
      _sum: {
        priceSubtotal: true
      }
    });
    const costLines = await prisma.invoiceLine.aggregate({
      where: {
        productId,
        invoice: {
          type: 'in_invoice',
          state: {
            in: ['posted', 'paid']
          }
        }
      },
      _sum: {
        priceSubtotal: true
      }
    });
    const supplierCount = await prisma.productSupplierInfo.count({
      where: {
        productId
      }
    });
    const soldQty = new Decimal(sold._sum.quantity || 0);
    const purchasedQty = new Decimal(purchased._sum.quantity || 0);
    const onHandQty = new Decimal(onHand._sum.quantity || 0);
    const incomingQty = new Decimal(incoming._sum.quantity || 0);
    const outgoingQty = new Decimal(outgoing._sum.quantity || 0);
    const forecastedQty = onHandQty.plus(incomingQty).minus(outgoingQty);
    const totalRevenue = Number(revenueLines._sum.priceSubtotal || 0);
    const totalCost = Number(costLines._sum.priceSubtotal || 0);
    const profitMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue * 100 : 0;
    return {
      sold: soldQty.toNumber(),
      purchased: purchasedQty.toNumber(),
      onHand: onHandQty.toNumber(),
      forecasted: forecastedQty.toNumber(),
      incoming: incomingQty.toNumber(),
      outgoing: outgoingQty.toNumber(),
      variantsCount,
      journalItemsCount,
      totalRevenue,
      totalCost,
      profitMargin: Math.round(profitMargin * 100) / 100,
      supplierCount
    };
  } catch (e) {
    console.error("Failed to get product metrics", e);
    return {
      sold: 0,
      purchased: 0,
      onHand: 0,
      forecasted: 0,
      incoming: 0,
      outgoing: 0,
      variantsCount: 0,
      journalItemsCount: 0,
      totalRevenue: 0,
      totalCost: 0,
      profitMargin: 0,
      supplierCount: 0
    };
  }
}
export async function createTag(name: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    const tag = await prisma.productTag.create({
      data: {
        name,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
      }
    });
    return tag;
  } catch (e) {
    return null;
  }
}
export async function getTags() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    return await prisma.productTag.findMany();
  } catch (e) {
    return [];
  }
}
export async function getAttributes() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    return await prisma.attribute.findMany({
      include: {
        values: true
      }
    });
  } catch (e) {
    return [];
  }
}
export async function createAttribute(name: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    return await prisma.attribute.create({
      data: {
        name
      }
    });
  } catch (e) {
    return null;
  }
}
export async function createAttributeValue(attributeId: string, name: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    return await prisma.attributeValue.create({
      data: {
        attributeId,
        name
      }
    });
  } catch (e) {
    return null;
  }
}
function trackChanges(original: any, current: any, fields: Record<string, string>) {
  const changes: {
    fieldName: string;
    fieldDesc: string;
    oldValue: string;
    newValue: string;
  }[] = [];
  for (const [key, label] of Object.entries(fields)) {
    const oldVal = original[key];
    const newVal = current[key];
    if (oldVal != newVal) {
      let formattedOld = oldVal?.toString() || '';
      let formattedNew = newVal?.toString() || '';
      if (typeof oldVal === 'boolean') {
        formattedOld = oldVal ? '✓' : '✗';
      }
      if (typeof newVal === 'boolean') {
        formattedNew = newVal ? '✓' : '✗';
      }
      if (!formattedOld && !formattedNew) continue;
      changes.push({
        fieldName: key,
        fieldDesc: label,
        oldValue: formattedOld,
        newValue: formattedNew
      });
    }
  }
  return changes;
}
export async function updateProduct(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('product', 'write');
  await validateAccess(session.userId, 'product', 'write');
  try {
    const originalProduct = await prisma.product.findUnique({
      where: {
        id
      }
    });
    await prisma.productAttributeLine.deleteMany({
      where: {
        productId: id
      }
    });
    const product = await prisma.product.update({
      where: {
        id
      },
      data: {
        name: data.name,
        image: data.image,
        description: data.description || null,
        type: data.detailedType || 'consu',
        canBeSold: data.can_sell ?? true,
        canBePurchased: data.can_purchase ?? true,
        isPromotedForSale: data.isPromotedForSale ?? false,
        invoicingPolicy: data.invoicingPolicy || 'ordered',
        uom: data.uom,
        purchaseUom: data.purchaseUom,
        hasSecondaryUnit: data.hasSecondaryUnit,
        secondaryUom: data.secondaryUom,
        secondaryUomFactor: safeDecimal(data.secondaryUomFactor, 1.0) as any,
        salePrice: safeDecimal(data.salePrice) as any,
        costPrice: safeDecimal(data.costPrice) as any,
        taxes: safeDecimal(data.taxes) as any,
        internalReference: data.internalReference || null,
        barcode: data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null,
        manufacturer: data.manufacturer || null,
        categoryId: data.categoryId && data.categoryId !== 'All' && data.categoryId !== 'all' ? data.categoryId : null,
        tags: {
          set: []
        },
        attributeLines: {
          create: (data.attributeLines || []).filter((line: any) => line.attributeId && line.valueIds?.length > 0).map((line: any) => ({
            attributeId: line.attributeId,
            values: {
              connect: line.valueIds.map((valId: string) => ({
                id: valId
              }))
            }
          }))
        },
        supplierInfo: {
          deleteMany: {},
          create: (data.suppliers || []).filter((s: any) => s.partnerId && s.partnerId !== '').map((s: any) => ({
            partnerId: s.partnerId,
            price: new Decimal(s.price || 0),
            minQty: new Decimal(s.minQty || 0),
            delay: parseInt(s.delay || 0),
            productCode: s.productCode
          }))
        }
      }
    });
if (data.boms !== undefined) {
  const existingBoms = await (prisma as any).billOfMaterial.findMany({
    where: {
      productId: id
    }
  });
  for (const bom of existingBoms) {
    await (prisma as any).bOMLine.deleteMany({
      where: {
        bomId: bom.id
      }
    });
  }
  await (prisma as any).billOfMaterial.deleteMany({
    where: {
      productId: id
    }
  });
  if (data.boms && data.boms.length > 0) {
    await (prisma as any).billOfMaterial.create({
      data: {
        productId: id,
        type: 'kit',
        companyId: session.companyId,
        lines: {
          create: data.boms.map((bomLine: any) => ({
            componentId: bomLine.componentId,
            quantity: new Decimal(bomLine.quantity || 1),
            uom: bomLine.uom || ''
          }))
        }
      }
    });
  }
}
if (data.boms !== undefined) await generateVariants(id);
const oldFactor = originalProduct?.secondaryUomFactor ? new Decimal(originalProduct.secondaryUomFactor) : new Decimal(1);
const newFactorRaw = safeDecimal(data.secondaryUomFactor, 1.0);
const newFactor = newFactorRaw ? new Decimal(newFactorRaw as any) : new Decimal(1);
if (originalProduct && data.hasSecondaryUnit && !oldFactor.equals(newFactor) && newFactor.greaterThan(0) && oldFactor.greaterThan(0)) {
  const ratio = newFactor.dividedBy(oldFactor);
  const quants = await prisma.stockQuant.findMany({
    where: {
      productId: id
    }
  });
  for (const q of quants) {
    const updatedQty = new Decimal(q.quantity).times(ratio).toDecimalPlaces(2);
    await prisma.stockQuant.update({
      where: {
        id: q.id
      },
      data: {
        quantity: updatedQty
      }
    });
  }
}
if (originalProduct) {
  const currentFlat = {
    ...product,
    secondaryUomFactor: Number(product.secondaryUomFactor),
    salePrice: Number(product.salePrice),
    costPrice: Number((product as any).costPrice),
    taxes: Number(product.taxes),
    weight: Number(product.weight),
    volume: Number(product.volume)
  };
  const originalFlat = {
    ...originalProduct,
    secondaryUomFactor: Number(originalProduct.secondaryUomFactor),
    salePrice: Number(originalProduct.salePrice),
    costPrice: Number(originalProduct.costPrice),
    taxes: Number(originalProduct.taxes),
    weight: Number(originalProduct.weight),
    volume: Number(originalProduct.volume)
  };
  const trackedFields = {
    name: 'اسم المنتج',
    salePrice: 'سعر البيع',
    costPrice: 'التكلفة',
    barcode: 'الباركود',
    internalReference: 'المرجع الداخلي',
    uom: 'وحدة القياس',
    canBeSold: 'يمكن بيعه',
    canBePurchased: 'يمكن شراؤه',
    type: 'نوع المنتج'
  };
  const changes = trackChanges(originalFlat, currentFlat, trackedFields);
  if (changes.length > 0) {
    await prisma.message.create({
      data: {
        productId: id,
        body: 'تم تحديث تفاصيل المنتج',
        type: 'notification',
        subtype: 'mt_note',
        authorId: null,
        trackingValues: {
          create: changes.map(c => ({
            fieldName: c.fieldName,
            fieldDesc: c.fieldDesc,
            oldValue: c.oldValue,
            newValue: c.newValue
          }))
        }
      }
    });
  }
}
    await logAuditAction({
      action: "update",
      model: "product",
      recordId: product.id,
      recordName: product.name,
      newValues: { name: data.name, salePrice: data.salePrice, costPrice: data.costPrice },
    });
    revalidatePath('/', 'layout');
    return product;
  } catch (e) {
    console.error("Failed to update product", e);
    throw e;
  }
}
export async function generateVariants(templateId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const template = await prisma.product.findUnique({
      where: {
        id: templateId
      },
      include: {
        attributeLines: {
          include: {
            values: true
          }
        }
      }
    });
    if (!template || template.attributeLines.length === 0) return;
    const attributes = template.attributeLines.map((line: any) => line.values);
    if (attributes.length === 0) return;
    const cartesian = (args: any[]): any[][] => {
      const r: any[][] = [];
      const max = args.length - 1;
      function helper(arr: any[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0);
          a.push(args[i][j]);
          if (i === max) r.push(a);else helper(a, i + 1);
        }
      }
      helper([], 0);
      return r;
    };
    const combinations = cartesian(attributes);
    for (const combination of combinations) {
      const valueIds = combination.map((v: any) => v.id);
      const valueNames = combination.map((v: any) => v.name).join(', ');
      const variantName = `${template.name} (${valueNames})`;
      const existingVariants = await prisma.product.findMany({
        where: {
          templateId
        },
        include: {
          variantValues: true
        }
      });
      const exists = existingVariants.find((v: any) => {
        const vIds = v.variantValues.map((val: any) => val.id).sort();
        const targetIds = valueIds.slice().sort();
        return JSON.stringify(vIds) === JSON.stringify(targetIds);
      });
      if (!exists) {
        await prisma.product.create({
          data: {
            name: variantName,
            templateId: templateId,
            type: template.type,
            canBeSold: template.canBeSold,
            canBePurchased: template.canBePurchased,
            uom: template.uom,
            salePrice: template.salePrice,
            costPrice: template.costPrice,
            taxes: template.taxes,
            variantValues: {
              connect: valueIds.map(id => ({
                id
              }))
            },
            companyId: session.companyId
          }
        });
      } else {
        await prisma.product.update({
          where: {
            id: exists.id
          },
          data: {
            name: variantName
          }
        });
      }
    }
    revalidatePath('/', 'layout');
  } catch (e) {
    console.error("Failed to generate variants", e);
  }
}
export async function getProductPagination(currentId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    const index = products.findIndex((p: any) => p.id === currentId);
    const total = products.length;
    if (index === -1) return {
      prev: null,
      next: null,
      index: 0,
      total
    };
    const prev = index > 0 ? products[index - 1].id : null;
    const next = index < total - 1 ? products[index + 1].id : null;
    return {
      prev,
      next,
      index: index + 1,
      total
    };
  } catch (e) {
    return {
      prev: null,
      next: null,
      index: 0,
      total: 0
    };
  }
}
export async function getUoms() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "read");
  try {
    const uoms = await prisma.uom.findMany({
      include: {
        category: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    return uoms.map((uom: any) => ({
      ...uom,
      ratio: uom.ratio.toNumber(),
      rounding: uom.rounding.toNumber()
    }));
  } catch (e) {
    return [];
  }
}
export async function getCategory(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  return await prisma.productCategory.findUnique({
    where: {
      id
    },
    include: {
      parent: true
    }
  });
}
export async function getUomCategories() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "read");
  try {
    return await prisma.uomCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  } catch (e) {
    return [];
  }
}
export async function createUomCategory(name: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "write");
  try {
    const cat = await prisma.uomCategory.create({
      data: {
        name
      }
    });
    return cat;
  } catch (e) {
    throw e;
  }
}
export async function createUom(data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "write");
  try {
    let categoryId = data.categoryId;
    if (!categoryId || categoryId === '') {
      const existingCat = await prisma.uomCategory.findFirst({
        orderBy: {
          name: 'asc'
        }
      });
      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const newCat = await prisma.uomCategory.create({
          data: {
            name: 'الوحدة'
          }
        });
        categoryId = newCat.id;
      }
    }
    const uom = await prisma.uom.create({
      data: {
        name: data.name,
        categoryId: categoryId,
        type: data.type,
        ratio: parseFloat(data.ratio),
        rounding: parseFloat(data.rounding),
        active: true
      }
    });
    await logAuditAction({
      action: "create",
      model: "uom",
      recordId: uom.id,
      recordName: uom.name,
      newValues: { name: data.name, type: data.type, ratio: data.ratio },
    });
    revalidatePath('/[locale]/inventory/configuration/uom');
    return {
      ...uom,
      ratio: uom.ratio.toNumber(),
      rounding: uom.rounding.toNumber()
    };
  } catch (e) {
    throw e;
  }
}
export async function updateUom(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "write");
  try {
    const uom = await prisma.uom.update({
      where: {
        id
      },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        type: data.type,
        ratio: parseFloat(data.ratio),
        rounding: parseFloat(data.rounding),
        active: data.active
      }
    });
    await logAuditAction({
      action: "update",
      model: "uom",
      recordId: uom.id,
      recordName: uom.name,
      newValues: { name: data.name, type: data.type, ratio: data.ratio },
    });
    revalidatePath('/[locale]/inventory/configuration/uom');
    return {
      ...uom,
      ratio: uom.ratio.toNumber(),
      rounding: uom.rounding.toNumber()
    };
  } catch (e) {
    throw e;
  }
}
export async function deleteUom(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "write");
  try {
    await prisma.uom.delete({
      where: {
        id
      }
    });
    await logAuditAction({
      action: "delete",
      model: "uom",
      recordId: id,
      recordName: "",
    });
    revalidatePath('/[locale]/inventory/configuration/uom');
    return {
      success: true
    };
  } catch (e) {
    throw e;
  }
}
export async function searchProducts(query: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  const products = await prisma.product.findMany({
    where: {
      OR: [{
        name: {
          contains: query
        }
      }, {
        internalReference: {
          contains: query
        }
      }, {
        barcode: {
          contains: query
        }
      }]
    },
    include: {
      attributeLines: {
        include: {
          attribute: true,
          values: true
        }
      },
      template: {
        select: {
          name: true
        }
      }
    },
    take: 20
  });
  return products.map((p: any) => {
    let displayName = p.name;
    if (p.templateId && p.attributeLines.length > 0) {
      const variantInfo = p.attributeLines.map((l: any) => `${l.attribute.name}: ${l.values.map((v: any) => v.name).join(', ')}`).join('; ');
      displayName = `${p.template.name} (${variantInfo})`;
    }
    return {
      id: p.id,
      name: displayName,
      price: Number(p.salePrice || 0),
      uom: p.uom,
      secondaryUnit: p.secondaryUom,
      hasSecondaryUnit: p.hasSecondaryUnit,
      taxes: Number(p.taxes || 0),
      productType: p.type
    };
  });
}
export async function createScrapOrder(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  const productId = formData.get('productId') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  const sourceLocationId = formData.get('sourceLocationId') as string;
  const scrapLocationId = formData.get('scrapLocationId') as string;
  if (!productId || !quantity || !sourceLocationId || !scrapLocationId) {
    return {
      error: 'Missing required fields'
    };
  }
  try {
    const spCount = await prisma.stockScrap.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });
    const scrap = await prisma.stockScrap.create({
      data: {
        name: `SP/${String(spCount + 1).padStart(5, '0')}`,
        productId,
        quantity,
        sourceLocationId,
        scrapLocationId,
        state: 'draft',
        companyId: session.companyId
      }
    });
    await logAuditAction({
      action: "create",
      model: "stockScrap",
      recordId: scrap.id,
      recordName: scrap.name,
      newValues: { productId, quantity, sourceLocationId, scrapLocationId },
    });
    try {
      revalidatePath(`/${session.locale}/inventory/scrap`);
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return {
      success: true,
      id: scrap.id
    };
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to create scrap order'
    };
  }
}
export async function validateScrap(scrapId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    const scrap = await prisma.stockScrap.findUnique({
      where: {
        id: scrapId
      },
      include: {
        product: true
      }
    });
    if (!scrap || scrap.state !== 'draft') {
      return {
        error: 'Invalid scrap order'
      };
    }
    const move = await prisma.stockMove.create({
      data: {
        name: scrap.name,
        productId: scrap.productId,
        sourceLocationId: scrap.sourceLocationId,
        destLocationId: scrap.scrapLocationId,
        quantity: scrap.quantity,
        quantityDone: scrap.quantity,
        status: 'done',
        date: new Date(),
        companyId: scrap.companyId,
        scrapId: scrap.id
      }
    });
    const fullMove = await prisma.stockMove.findUnique({
      where: {
        id: move.id
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });
    const {
      generateStockMoveEntryV2
    } = await import('./accounting');
    await generateStockMoveEntryV2(move.id);
    await prisma.stockScrap.update({
      where: {
        id: scrapId
      },
      data: {
        state: 'done',
        moveId: move.id
      }
    });
    await logAuditAction({
      action: "validate",
      model: "stockScrap",
      recordId: scrapId,
      recordName: scrap.name,
      newValues: { state: 'done', moveId: move.id },
    });
    try {
      revalidatePath(`/${session.locale}/inventory/scrap`);
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return {
      success: true
    };
  } catch (e) {
    console.error(e);
    return {
      error: 'Failed to validate scrap order'
    };
  }
}
export async function returnPicking(pickingId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const newPicking = await prisma.$transaction(async tx => {
      const original = await tx.stockPicking.findUnique({
        where: {
          id: pickingId
        },
        include: {
          moves: true
        }
      });
      if (!original) throw new Error("Original picking not found");
      let returnType = 'INTERNAL';
      let sourceLocId = original.locationDestId;
      let destLocId = original.locationId;
      if (original.pickingType === 'INCOMING') returnType = 'OUTGOING';else if (original.pickingType === 'OUTGOING') returnType = 'INCOMING';
      const retCount = await tx.stockPicking.count({
        where: {
          pickingType: returnType,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });
      const returnPicking = await tx.stockPicking.create({
        data: {
          name: `WH/RET/${String(retCount + 1).padStart(5, "0")}`,
          companyId: session.companyId,
          pickingType: returnType,
          locationId: sourceLocId,
          locationDestId: destLocId,
          partnerId: original.partnerId,
          status: 'assigned',
          scheduledDate: new Date(),
          origin: `Return of ${original.name}`,
          moves: {
            create: original.moves.map((move: any) => ({
              companyId: session.companyId,
              productId: move.productId,
              quantity: move.quantityDone,
              quantityDone: 0,
              name: move.name || `Return of ${original.name}`,
              sourceLocationId: sourceLocId,
              destLocationId: destLocId,
              status: 'draft',
              unitName: move.unitName,
              secQty: move.secQtyDone,
              secUnitName: move.secUnitName
            }))
          }
        }
      });
      return returnPicking;
    });
    await logAuditAction({
      action: "create",
      model: "picking",
      recordId: newPicking.id,
      recordName: `Return of ${pickingId}`,
      newValues: { returnOfPickingId: pickingId },
    });
    try {
      revalidatePath('/[locale]/inventory/operations');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return {
      success: true,
      id: newPicking.id
    };
  } catch (error: any) {
    console.error("Return Picking Error:", error);
    return {
      error: error.message
    };
  }
}
export async function getProductBoms(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      include: {
        boms: {
          include: {
            lines: {
              include: {
                component: true
              }
            }
          }
        }
      }
    });
    if (!product || !product.boms || product.boms.length === 0) return [];
    const firstBom = product.boms[0];
    return firstBom.lines.map((line: any) => ({
      id: line.id,
      componentId: line.componentId,
      componentName: line.component.name,
      quantity: Number(line.quantity),
      uom: line.uom || line.component.uom,
      cost: Number(line.component.costPrice || 0)
    }));
  } catch (error) {
    console.error("Failed to fetch BOMs", error);
    return [];
  }
}
export async function getAllProducts() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const session = await getSession();
    if (!session) return [];
    const products = await prisma.product.findMany({
      where: {
        companyId: session.companyId
      },
      select: {
        id: true,
        name: true,
        uom: true,
        costPrice: true,
        hasSecondaryUnit: true,
        secondaryUom: true,
        secondaryUomFactor: true
      }
    });
    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      uom: p.uom,
      costPrice: Number(p.costPrice || 0),
      hasSecondaryUnit: Boolean(p.hasSecondaryUnit),
      secondaryUom: p.secondaryUom,
      secondaryUomFactor: Number(p.secondaryUomFactor || 1)
    }));
  } catch (error) {
    return [];
  }
}
export async function getProductIdsByFilter(opts?: {
  type?: string;
  categoryId?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const session = await getSession();
    if (!session) return [];
    const where: any = {
      active: true,
      companyId: session.companyId,
      templateId: null
    };
    if (opts?.type) where.type = opts.type;
    if (opts?.categoryId) where.categoryId = opts.categoryId;
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true
      }
    });
    return products.map((p: any) => p.id);
  } catch (error) {
    return [];
  }
}
export async function getAdjacentProductIds(currentProductId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const session = await getSession();
    if (!session) return {
      next: null,
      prev: null
    };
    const allProducts = await prisma.product.findMany({
      where: {
        companyId: session.companyId
      },
      orderBy: {
        name: 'asc'
      }
    });
    if (allProducts.length <= 1) return {
      next: null,
      prev: null
    };
    const currentIndex = allProducts.findIndex(p => p.id === currentProductId);
    if (currentIndex === -1) return {
      next: null,
      prev: null
    };
    const prevId = currentIndex > 0 ? allProducts[currentIndex - 1].id : null;
    const nextId = currentIndex < allProducts.length - 1 ? allProducts[currentIndex + 1].id : null;
    return {
      prev: prevId,
      next: nextId
    };
  } catch (e) {
    console.error("Failed to fetch adjacent products", e);
    return {
      next: null,
      prev: null
    };
  }
}
export async function getLots(filters?: {
  productId?: string;
  search?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const lots = await prisma.stockLot.findMany({
      where: {
        companyId: session.companyId,
        ...(filters?.productId ? {
          productId: filters.productId
        } : {}),
        ...(filters?.search ? {
          OR: [{
            name: {
              contains: filters.search
            }
          }, {
            ref: {
              contains: filters.search
            }
          }]
        } : {})
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        quants: {
          include: {
            location: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return lots.map((lot: any) => {
      const totalQty = lot.quants.reduce((sum: number, q: any) => sum + Number(q.quantity), 0);
      return {
        id: lot.id,
        name: lot.name,
        productId: lot.productId,
        productName: lot.product?.name || '',
        ref: lot.ref,
        expirationDate: lot.expirationDate,
        note: lot.note,
        totalQuantity: totalQty,
        locations: lot.quants.map((q: any) => ({
          locationName: q.location?.name || '',
          quantity: Number(q.quantity)
        })),
        createdAt: lot.createdAt
      };
    });
  } catch (e) {
    console.error("Failed to get lots", e);
    return [];
  }
}
export async function getLotsForProduct(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const lots = await prisma.stockLot.findMany({
      where: {
        productId,
        companyId: session.companyId
      },
      select: {
        id: true,
        name: true,
        ref: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    return lots.map((l: any) => ({
      value: l.id,
      label: l.name + (l.ref ? ` (${l.ref})` : '')
    }));
  } catch (e) {
    return [];
  }
}
export async function createLot(data: {
  name: string;
  productId: string;
  ref?: string;
  expirationDate?: string;
  note?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    const lot = await prisma.stockLot.create({
      data: {
        name: data.name,
        productId: data.productId,
        ref: data.ref || null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        note: data.note || null,
        companyId: session.companyId
      }
    });
    await logAuditAction({
      action: "create",
      model: "stockLot",
      recordId: lot.id,
      recordName: lot.name,
      newValues: { name: data.name, productId: data.productId },
    });
    try {
      revalidatePath('/[locale]/inventory/lots');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return lot;
  } catch (e: any) {
    console.error('Failed to create lot', e);
    if (e.code === 'P2002') {
      throw new Error(`رقم اللوت "${data.name}" موجود مسبقاً لهذا المنتج`);
    }
    throw e;
  }
}
export async function updateLot(id: string, data: {
  name?: string;
  ref?: string;
  expirationDate?: string;
  note?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    const lot = await prisma.stockLot.update({
      where: {
        id
      },
      data: {
        ...(data.name ? {
          name: data.name
        } : {}),
        ref: data.ref ?? undefined,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
        note: data.note ?? undefined
      }
    });
    await logAuditAction({
      action: "update",
      model: "stockLot",
      recordId: lot.id,
      recordName: lot.name,
      newValues: { name: data.name, ref: data.ref },
    });
    try {
      revalidatePath('/[locale]/inventory/lots');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return lot;
  } catch (e) {
    console.error('Failed to update lot', e);
    throw e;
  }
}
export async function deleteLot(id: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    const quants = (await prisma.stockQuant.findMany({
      where: {
        lotId: id
      }
    })) as any[];
    const hasStock = quants.some(q => Number(q.quantity) !== 0);
    if (hasStock) {
      throw new Error('لا يمكن حذف لوت يحتوي على رصيد مخزون');
    }
    await prisma.stockLot.delete({
      where: {
        id
      }
    });
    await logAuditAction({
      action: "delete",
      model: "stockLot",
      recordId: id,
      recordName: "",
    });
    try {
      revalidatePath('/[locale]/inventory/lots');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return {
      success: true
    };
  } catch (e) {
    console.error('Failed to delete lot', e);
    throw e;
  }
}
export async function getProductsWithTracking() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const products = await prisma.product.findMany({
      where: {
        companyId: session.companyId,
        tracking: {
          not: 'none'
        }
      },
      select: {
        id: true,
        name: true,
        tracking: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    return products.map((p: any) => ({
      value: p.id,
      label: p.name,
      tracking: p.tracking
    }));
  } catch (e) {
    return [];
  }
}
export async function updateProductQuantity(productId: string, locationId: string, newQuantity: number, lotId?: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "write");
  try {
    const moveIds: string[] = [];
    await prisma.$transaction(async tx => {
      const quant = await tx.stockQuant.findFirst({
        where: {
          productId,
          locationId,
          lotId: lotId || null
        }
      });
      const currentQty = quant ? new Decimal(quant.quantity) : new Decimal(0);
      const targetQty = new Decimal(newQuantity);
      const diff = targetQty.minus(currentQty);
      if (diff.isZero()) return;
      const move = await tx.stockMove.create({
        data: {
          companyId: session.companyId,
          name: `تحديث الكمية: ${new Date().toISOString()}`,
          productId,
          quantity: diff.abs(),
          quantityDone: diff.abs(),
          sourceLocationId: diff.isNegative() ? locationId : null,
          destLocationId: diff.isPositive() ? locationId : null,
          lotId: lotId || null,
          status: 'done'
        }
      });
      moveIds.push(move.id);
      if (quant) {
        await tx.stockQuant.update({
          where: {
            id: quant.id
          },
          data: {
            quantity: targetQty
          }
        });
      } else {
        await tx.stockQuant.create({
          data: {
            companyId: session.companyId,
            locationId,
            productId,
            quantity: targetQty,
            lotId: lotId || null
          }
        });
      }
    });
    for (const id of moveIds) {
      await generateStockMoveEntry(id);
    }
    try {
      revalidatePath('/', 'layout');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return {
      success: true
    };
  } catch (e) {
    console.error('Failed to update product quantity', e);
    throw e;
  }
}
export async function toggleFavorite(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        isFavorite: true
      }
    });
    if (!product) throw new Error('Product not found');
    await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        isFavorite: !(product as any).isFavorite
      }
    });
    try {
      revalidatePath('/', 'layout');
      revalidatePath(`/[locale]/inventory/products/${productId}`);
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return {
      success: true,
      isFavorite: !(product as any).isFavorite
    };
  } catch (e) {
    console.error('Failed to toggle favorite', e);
    throw e;
  }
}
export async function getProductStockMoves(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  if (!session?.companyId) throw new Error("Unauthorized");
  return await prisma.stockMove.findMany({
    where: {
      productId,
      companyId: session.companyId
    },
    include: {
      sourceLocation: true,
      destLocation: true,
      picking: true
    },
    orderBy: {
      date: 'desc'
    }
  });
}
export async function getProductSaleLines(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  if (!session?.companyId) throw new Error("Unauthorized");
  return await prisma.saleOrderLine.findMany({
    where: {
      productId,
      order: {
        companyId: session.companyId
      }
    },
    include: {
      order: {
        include: {
          user: true,
          salesTeam: true,
          partner: true
        }
      }
    },
    orderBy: {
      order: {
        dateOrder: 'desc'
      }
    }
  });
}
export async function getProductPurchaseLines(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  if (!session?.companyId) throw new Error("Unauthorized");
  return await prisma.purchaseOrderLine.findMany({
    where: {
      productId,
      order: {
        companyId: session.companyId
      }
    },
    include: {
      order: {
        include: {
          partner: true
        }
      }
    },
    orderBy: {
      order: {
        dateOrder: 'desc'
      }
    }
  });
}
export async function getProductQuants(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId
      },
      select: {
        name: true,
        uom: true
      }
    });
    const internalLocations = await prisma.location.findMany({
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
    if (internalLocations.length > 0) {
      for (const loc of internalLocations) {
        const existing = await prisma.stockQuant.findFirst({
          where: {
            productId,
            locationId: loc.id
          }
        });
        if (!existing) {
          await prisma.stockQuant.create({
            data: {
              productId,
              locationId: loc.id,
              companyId: session.companyId,
              quantity: 0
            }
          });
        }
      }
    }
    const quants = await prisma.stockQuant.findMany({
      where: {
        productId,
        companyId: session.companyId
      },
      include: {
        location: true
      },
      orderBy: {
        location: {
          name: 'asc'
        }
      }
    });
    const data = quants.map((q: any) => ({
      id: q.id,
      locationId: q.locationId,
      locationName: q.location.name,
      productName: product?.name || '',
      onHand: Number(q.quantity),
      uom: product?.uom || 'قطعة',
      countedQty: null
    }));
    return {
      data,
      productName: product?.name
    };
  } catch (e: any) {
    return {
      error: e.message
    };
  }
}
export async function applyInventoryAdjustment(quantId: string, countedQuantity: number) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("stock_picking", "read");
  try {
    const result = await prisma.$transaction(async tx => {
      const quant = await tx.stockQuant.findUnique({
        where: {
          id: quantId
        },
        include: {
          product: true,
          location: true
        }
      });
      if (!quant) throw new Error("لم يتم العثور على الكمية");
      const diff = countedQuantity - Number(quant.quantity);
      if (diff === 0) return {
        success: true
      };
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
      const isSurplus = diff > 0;
      const sourceLocId = isSurplus ? adjLoc.id : quant.locationId;
      const destLocId = isSurplus ? quant.locationId : adjLoc.id;
      const move = await tx.stockMove.create({
        data: {
          companyId: session.companyId,
          productId: quant.productId,
          quantity: new Decimal(Math.abs(diff)),
          quantityDone: new Decimal(Math.abs(diff)),
          status: 'done',
          name: 'تم تحديث كمية المنتج',
          reference: 'تم تحديث كمية المنتج',
          sourceLocationId: sourceLocId,
          destLocationId: destLocId,
          date: new Date(),
          unitName: quant.product.uom
        }
      });
      await tx.stockQuant.update({
        where: {
          id: quantId
        },
        data: {
          quantity: countedQuantity
        }
      });
      const cost = Number(quant.product.costPrice || 0);
      const totalVal = Math.abs(diff) * cost;
      if (totalVal > 0) {
        let inventoryAccount = quant.product.propertyAccountExpenseId;
        if (!inventoryAccount) {
          const defaultAcc = await tx.account.findFirst({
            where: {
              companyId: session.companyId,
              code: '103029'
            }
          });
          inventoryAccount = defaultAcc?.id || null;
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
                name: `تسوية جرد - ${quant.product.name}`,
                companyId: session.companyId,
                journalId: journal.id,
                date: new Date(),
                ref: `تسوية جرد - ${quant.product.name}`,
                state: 'posted'
              }
            });
            await tx.journalItem.create({
              data: {
                entryId: entry.id,
                accountId: isSurplus ? inventoryAccount : adjAccount.id,
                debit: totalVal,
                credit: 0,
                name: `تم تحديث كمية المنتج - ${quant.product.name}`
              }
            });
            await tx.journalItem.create({
              data: {
                entryId: entry.id,
                accountId: isSurplus ? adjAccount.id : inventoryAccount,
                debit: 0,
                credit: totalVal,
                name: `تم تحديث كمية المنتج - ${quant.product.name}`
              }
            });
          }
        }
      }
      return {
        success: true
      };
    });
    try {
      revalidatePath('/', 'layout');
    } catch (error) { console.error("Silent error caught in app/actions/inventory.ts:", error); }
    return result;
  } catch (e: any) {
    return {
      error: e.message
    };
  }
}

export async function fetchProductsForGroup(groupBy: string, groupKey: string) {
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) return [];
  // We need to fetch products matching this group
  let where: any = { companyId, active: true };
  if (groupBy === 'category') {
    if (groupKey === 'بدون فئة') {
      where.categoryId = null;
    } else {
      where.category = { name: groupKey };
    }
  } else if (groupBy === 'type') {
    // groupKey is the label, e.g., "مخزني"
    const typeMap: any = { "مخزني": "storable", "خدمة": "service", "الاستهلاكي": "consu" };
    where.type = typeMap[groupKey] || groupKey;
  }
  
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      tags: true,
      stockQuants: { include: { location: true } }
    },
    take: 100 // limit to 100 per group for performance
  });
  
  const userIds = [...new Set(products.map((p: any) => p.createdById).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: { id: true, name: true }
  });
  const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.name }), {});

  const enhanced = await Promise.all(
    products.map(async (product: any) => {
      const metrics = await getProductMetrics(product.id);
      const totalStock = product.stockQuants?.reduce((sum: number, q: any) => sum + (Number(q.quantity) || 0), 0) || 0;
      return {
        ...product,
        totalStock,
        salePrice: Number(product.salePrice),
        costPrice: Number(product.costPrice),
        forecastedQty: metrics.forecasted,
        responsibleName: product.createdById ? userMap[product.createdById] || "غير معروف" : "غير محدد"
      };
    })
  );
  
  return JSON.parse(JSON.stringify(enhanced));
}

export async function getProductsForExport(selectedIds: string[], filter: string | null) {
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) return [];
  let where: any = { companyId, active: true };
  if (selectedIds.length > 0) {
    where.id = { in: selectedIds };
  } else if (filter) {
    if (filter === 'storable') where.type = 'storable';
    if (filter === 'service') where.type = 'service';
    if (filter === 'can_sell') where.canSell = true;
    if (filter === 'can_purchase') where.canPurchase = true;
    if (filter === 'archived') where.active = false;
  }
  
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      stockQuants: true
    }
  });
  
  return products.map((p: any) => ({
    id: p.id,
    internal_reference: p.internalReference || '',
    barcode: p.barcode || '',
    name: p.name,
    category: p.category?.name || '',
    type: p.type === 'storable' ? 'المنتجات (المخزني)' : p.type === 'service' ? 'الخدمات' : 'الاستهلاكي',
    cost_price: Number(p.costPrice),
    sale_price: Number(p.salePrice),
    stock: p.stockQuants?.reduce((sum: number, q: any) => sum + Number(q.quantity || 0), 0) || 0,
    uom: p.uom || ''
  }));
}
