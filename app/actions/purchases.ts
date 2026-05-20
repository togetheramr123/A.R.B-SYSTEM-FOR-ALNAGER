"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';
import { ensureAccess } from '@/lib/access';
import { fail } from '@/lib/actionResult';
import { CreatePurchaseOrderSchema, validateSafe } from '@/lib/validations';
import { logTrackingChanges, TrackingChange } from '@/app/actions/chatter';
export async function createPurchaseOrder(data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'create');
  const validation = validateSafe(CreatePurchaseOrderSchema, data);
  if (!validation.success) return fail(validation.error);
  // Ensure lines is valid and filter empty placeholder rows
  if (!data.lines || !Array.isArray(data.lines)) data.lines = [];
  data.lines = data.lines.filter((line: any) => line.productId || (line.id && line.id !== ''));
  const lines = data.lines.map((line: any) => ({
    ...line,
    qty: new Decimal(line.qty || 0),
    price: new Decimal(line.price || 0),
    discount: new Decimal(line.discount || 0)
  }));
  const amountUntaxed = lines.reduce((sum: Decimal, line: any) => {
    const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100))).mul(new Decimal(1).minus(new Decimal(line.discount2 || 0).div(100)));
    return sum.plus(subtotal);
  }, new Decimal(0));
  const amountTax = lines.reduce((sum: Decimal, line: any) => {
    const taxRate = new Decimal(line.taxes || line.taxRate || 0);
    if (taxRate.isZero()) return sum;
    const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100))).mul(new Decimal(1).minus(new Decimal(line.discount2 || 0).div(100)));
    return sum.plus(subtotal.mul(taxRate.div(100)));
  }, new Decimal(0));
  return await prisma.$transaction(async tx => {
    let foundPartner = null;
    const potentialId = data.partnerId || data.vendor;
    if (potentialId && potentialId.length >= 24) {
      foundPartner = await tx.partner.findUnique({
        where: {
          id: potentialId
        }
      }).catch(() => null);
    }
    let partner = foundPartner || (await tx.partner.findFirst({
      where: {
        name: {
          contains: potentialId || ''
        }
      }
    }));

    if (!partner && potentialId) {
        partner = await tx.partner.create({
            data: {
                name: potentialId,
                isVendor: true,
                companyId: session.companyId
            }
        });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const countThisMonth = await tx.purchaseOrder.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });
    const seqNum = String(countThisMonth + 1).padStart(5, '0');
    const orderName = `P${seqNum}`;
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        name: orderName,
        companyId: session.companyId,
        partnerId: partner?.id || null,
        priceListId: data.priceListId || null,
        dateOrder: new Date(data.date),
        status: 'draft',
        createdById: session.userId,
        updatedById: session.userId,
        amountUntaxed,
        amountTax,
        amountTotal: amountUntaxed.plus(amountTax),
        lines: {
          create: await Promise.all(data.lines.map(async (line: any, i: number) => {
            const product = line.productId ? await tx.product.findUnique({
              where: {
                id: line.productId
              }
            }) : null;
            const qty = new Decimal(line.qty || 0);
            const price = new Decimal(line.price || 0);
            const discount = new Decimal(line.discount || 0);
            const discount2 = new Decimal(line.discount2 || 0);
            const subtotal = qty.mul(price).mul(new Decimal(1).minus(discount.div(100))).mul(new Decimal(1).minus(discount2.div(100)));
            const isSecondary = line.unitSelection === 'secondary';
            return {
              productId: product ? product.id : undefined,
              name: line.description || product?.name || 'Product',
              sequence: (i + 1) * 10,
              quantity: qty,
              priceUnit: price,
              discount1: discount,
              discount2: discount2,
              priceSubtotal: subtotal,
              taxRate: new Decimal(line.taxes || line.taxRate || 0),
              accountId: line.accountId || null,
              unitName: isSecondary ? product?.secondaryUom : product?.uom,
              secondaryQuantity: new Decimal(line.secondaryQty || 0),
              secondaryUnit: product?.hasSecondaryUnit ? product?.secondaryUom : null,
              appliedPriceListName: line.appliedPriceListName || null
            };
          }))
        }
      }
    });
    const user = await tx.user.findUnique({
      where: {
        id: session.userId
      }
    });
    await tx.message.create({
      data: {
        body: `قام <b>${user?.name || 'النظام'}</b> بإنشاء طلب عرض السعر.`,
        type: 'notification',
        subject: user?.name || 'System',
        purchaseOrderId: purchaseOrder.id
      }
    });
    return purchaseOrder;
  });
}
export async function createDraftPurchaseOrder() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'create');
  return await prisma.$transaction(async tx => {
    // Generate sequential monthly name
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const countThisMonth = await tx.purchaseOrder.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });
    const seqNum = String(countThisMonth + 1).padStart(5, '0');
    const orderName = `P${seqNum}`;
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        name: orderName,
        companyId: session.companyId,
        dateOrder: now,
        status: 'draft',
        createdById: session.userId,
        updatedById: session.userId,
        amountUntaxed: 0,
        amountTax: 0,
        amountTotal: 0
      }
    });
    const user = await tx.user.findUnique({
      where: {
        id: session.userId
      }
    });
    await tx.message.create({
      data: {
        body: `قام <b>${user?.name || 'النظام'}</b> بإنشاء مسودة طلب عرض السعر.`,
        type: 'notification',
        subject: user?.name || 'System',
        purchaseOrderId: purchaseOrder.id
      }
    });
    return purchaseOrder;
  });
}
export async function updatePurchaseOrder(orderId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'write');
  // Ensure lines is always a valid array, filter out empty placeholder rows
  if (!data.lines || !Array.isArray(data.lines)) data.lines = [];
  data.lines = data.lines.filter((line: any) => line.productId || (line.id && line.id !== ''));
  const amountUntaxed = data.lines.reduce((sum: Decimal, line: any) => {
    const qty = new Decimal(line.qty || 0);
    const price = new Decimal(line.price || 0);
    const discount = new Decimal(line.discount || 0);
    const discount2 = new Decimal(line.discount2 || 0);
    return sum.plus(qty.mul(price).mul(new Decimal(1).minus(discount.div(100))).mul(new Decimal(1).minus(discount2.div(100))));
  }, new Decimal(0));
  const amountTax = data.lines.reduce((sum: Decimal, line: any) => {
    const qty = new Decimal(line.qty || 0);
    const price = new Decimal(line.price || 0);
    const discount = new Decimal(line.discount || 0);
    const discount2 = new Decimal(line.discount2 || 0);
    const taxRate = new Decimal(line.taxes || line.taxRate || 0);
    const subtotal = qty.mul(price).mul(new Decimal(1).minus(discount.div(100))).mul(new Decimal(1).minus(discount2.div(100)));
    return sum.plus(subtotal.mul(taxRate.div(100)));
  }, new Decimal(0));
  const amountTotal = amountUntaxed.plus(amountTax);
  const txResult = await prisma.$transaction(async tx => {
    const current = await tx.purchaseOrder.findUnique({
      where: {
        id: orderId
      }
    });
    if (data.date && current?.dateOrder) {
      const existingDate = new Date(current.dateOrder);
      const newDate = new Date(data.date);
      if (existingDate.getMonth() !== newDate.getMonth() || existingDate.getFullYear() !== newDate.getFullYear()) {
        throw new Error("قفل الشهر المالي: لا يمكن تغيير تاريخ الطلب لشهر مختلف بعد حفظه وأخذه رقماً تسلسلياً.");
      }
    }
    let partner = null;
    const potentialId = data.partnerId || data.vendor;
    if (potentialId) {
      partner = await tx.partner.findUnique({
        where: {
          id: potentialId
        }
      }).catch(() => null);
    }
    const existingLines = await tx.purchaseOrderLine.findMany({
      where: {
        orderId
      }
    });
    const existingLineIds = existingLines.map((l: any) => l.id);
    const incomingLineIds = data.lines.map((l: any) => l.id).filter(Boolean);
    const linesToDelete = existingLineIds.filter((id: string) => !incomingLineIds.includes(id));
    if (linesToDelete.length > 0) {
      await tx.purchaseOrderLine.deleteMany({
        where: {
          id: {
            in: linesToDelete
          }
        }
      });
    }
    const purchaseOrder = await tx.purchaseOrder.update({
      where: {
        id: orderId
      },
      data: {
        partnerId: partner?.id || null,
        priceListId: data.priceListId || null,
        dateOrder: new Date(data.date),
        updatedById: session.userId,
        amountUntaxed,
        amountTax,
        amountTotal: amountUntaxed.plus(amountTax)
      }
    });
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      const product = line.productId ? await tx.product.findUnique({
        where: {
          id: line.productId
        }
      }) : null;
      const qty = new Decimal(line.qty || 0);
      const price = new Decimal(line.price || 0);
      const discount = new Decimal(line.discount || 0);
      const discount2 = new Decimal(line.discount2 || 0);
      const subtotal = qty.mul(price).mul(new Decimal(1).minus(discount.div(100))).mul(new Decimal(1).minus(discount2.div(100)));
      const isSecondary = line.unitSelection === 'secondary';
      const lineData = {
        productId: product ? product.id : undefined,
        name: line.description || product?.name || 'Product',
        sequence: (i + 1) * 10,
        quantity: qty,
        priceUnit: price,
        discount1: discount,
        discount2: discount2,
        priceSubtotal: subtotal,
        taxRate: new Decimal(line.taxes || line.taxRate || 0),
        accountId: line.accountId || null,
        unitName: isSecondary ? product?.secondaryUom : product?.uom,
        secondaryQuantity: new Decimal(line.secondaryQty || 0),
        secondaryUnit: product?.hasSecondaryUnit ? product?.secondaryUom : null,
        appliedPriceListName: line.appliedPriceListName || null
      };
      if (line.id && existingLineIds.includes(line.id)) {
        await tx.purchaseOrderLine.update({
          where: {
            id: line.id
          },
          data: lineData
        });
      } else {
        await tx.purchaseOrderLine.create({
          data: {
            ...lineData,
            orderId: orderId
          }
        });
      }
    }
    try {
      revalidatePath('/[locale]/purchases');
    } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
    return {
      purchaseOrder,
      existingLines,
      current
    };
  }); // ------------------------------------------------------------- // Audit Trail: Log changes in Chatter // -------------------------------------------------------------
  const changes: TrackingChange[] = [];
  const {
    purchaseOrder,
    existingLines,
    current
  } = txResult; // Compare Totals
  if (current && Number(current.amountTotal) !== Number(amountTotal)) {
    changes.push({
      fieldName: 'amountTotal',
      fieldDesc: 'الإجمالي',
      oldValue: String(current.amountTotal),
      newValue: String(amountTotal)
    });
  } // Compare Date
  if (current && new Date(current.dateOrder).getTime() !== new Date(data.date).getTime()) {
    changes.push({
      fieldName: 'dateOrder',
      fieldDesc: 'تاريخ الطلب',
      oldValue: new Date(current.dateOrder).toLocaleDateString('ar-EG'),
      newValue: new Date(data.date).toLocaleDateString('ar-EG')
    });
  } // Track Deleted Lines
  const existingLineIds = existingLines.map((l: any) => l.id);
  const incomingLineIds = data.lines.map((l: any) => l.id).filter(Boolean);
  const linesToDelete = existingLineIds.filter((id: string) => !incomingLineIds.includes(id));
  for (const id of linesToDelete) {
    const deletedLine = existingLines.find((l: any) => l.id === id);
    if (deletedLine) {
      changes.push({
        fieldName: 'lines',
        fieldDesc: 'بنود الطلب',
        oldValue: `[حُذف] ${deletedLine.name}`,
        newValue: 'مزال'
      });
    }
  } // Track Added and Updated Lines 
  for (const line of data.lines) {
    if (!line.id || !existingLineIds.includes(line.id)) {
      changes.push({
        fieldName: 'lines',
        fieldDesc: 'بنود الطلب',
        oldValue: 'جديد',
        newValue: `[أُضيف] ${line.description || 'منتج'} (كمية: ${line.qty})`
      });
    } else {
      const existingLine = existingLines.find((l: any) => l.id === line.id);
      if (existingLine && Number(existingLine.quantity) !== Number(line.qty)) {
        changes.push({
          fieldName: 'quantity',
          fieldDesc: `كمية ${existingLine.name}`,
          oldValue: String(existingLine.quantity),
          newValue: String(line.qty)
        });
      }
      if (existingLine && Number(existingLine.priceUnit) !== Number(line.price)) {
        changes.push({
          fieldName: 'priceUnit',
          fieldDesc: `سعر ${existingLine.name}`,
          oldValue: String(existingLine.priceUnit),
          newValue: String(line.price)
        });
      }
    }
  }
  if (changes.length > 0) {
    await logTrackingChanges('purchaseOrder', orderId, changes);
  }
  return purchaseOrder;
}
export async function confirmPurchaseOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'write');
  try {
    return await prisma.$transaction(async tx => {
      // Guard: prevent duplicate confirmation (idempotency check)
      const current = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        select: { status: true }
      });
      if (!current) throw new Error('أمر الشراء غير موجود');
      if (current.status === 'purchase' || current.status === 'done') {
        // Already confirmed - return silently to prevent duplicate pickings
        return { success: true, alreadyConfirmed: true };
      }

      const purchaseOrder = await tx.purchaseOrder.update({
        where: {
          id: orderId
        },
        data: {
          status: 'purchase'
        },
        include: {
          lines: {
            include: {
              product: true
            }
          }
        }
      });
      const user = await tx.user.findUnique({
        where: {
          id: session.userId
        }
      });
      await tx.message.create({
        data: {
          body: `حالة الطلب: طلب عرض سعر &rarr; <b>أمر شراء</b>`,
          type: 'notification',
          subject: user?.name || 'System',
          purchaseOrderId: purchaseOrder.id
        }
      });
      const supplierLocation = await tx.location.findFirst({
        where: {
          type: 'supplier'
        }
      });
      const inputLocation = await tx.location.findFirst({
        where: {
          type: 'internal'
        }
      });
      if (supplierLocation && inputLocation) {
        // Filter lines that have a product and are storable
        const storableLines = purchaseOrder.lines.filter((l: any) => l.product && l.product.type === 'storable');
        const positiveLines = storableLines.filter((l: any) => Number(l.quantity) > 0);
        const negativeLines = storableLines.filter((l: any) => Number(l.quantity) < 0);
        if (positiveLines.length > 0) {
          const picking = await tx.stockPicking.create({
            data: {
              name: `WH/IN/${purchaseOrder.name}/${String(positiveLines.length).padStart(2, '0')}`,
              companyId: session.companyId,
              pickingType: 'INCOMING',
              partnerId: purchaseOrder.partnerId,
              locationId: supplierLocation.id,
              locationDestId: inputLocation.id,
              origin: purchaseOrder.name,
              purchaseOrderId: purchaseOrder.id,
              status: 'assigned',
              scheduledDate: new Date()
            }
          });
          for (const line of positiveLines) {
            if (!line.productId) continue;
            const product = await tx.product.findUnique({
              where: {
                id: line.productId
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
            const isSecondary = line.unitName === product?.secondaryUom && product?.hasSecondaryUnit;
            const uomFactor = isSecondary ? new Decimal(product?.secondaryUomFactor || 1) : new Decimal(1);
            const prodAny = product as any;
            if (prodAny?.boms && prodAny.boms.length > 0 && prodAny.boms[0].type === 'kit') {
              const bom = prodAny.boms[0];
              for (const bomLine of bom.lines) {
                await tx.stockMove.create({
                  data: {
                    companyId: session.companyId,
                    pickingId: picking.id,
                    productId: bomLine.componentId,
                    purchaseLineId: line.id,
                    quantity: new Decimal(line.quantity).mul(uomFactor).mul(new Decimal(bomLine.quantity)),
                    name: `${bomLine.component.name} (for ${line.name})`,
                    sourceLocationId: supplierLocation.id,
                    destLocationId: inputLocation.id,
                    status: 'assigned',
                    unitName: bomLine.uom || bomLine.component.uom
                  }
                });
              }
            } else {
              await tx.stockMove.create({
                data: {
                  companyId: session.companyId,
                  pickingId: picking.id,
                  productId: line.productId,
                  purchaseLineId: line.id,
                  quantity: new Decimal(line.quantity).mul(uomFactor),
                  name: line.name || 'Product Receipt',
                  sourceLocationId: supplierLocation.id,
                  destLocationId: inputLocation.id,
                  status: 'assigned',
                  unitName: product?.uom,
                  secQty: isSecondary ? new Decimal(line.quantity) : new Decimal(0),
                  secUnitName: isSecondary ? line.unitName : null
                }
              });
            }
          }
        }
        if (negativeLines.length > 0) {
          const returnPicking = await tx.stockPicking.create({
            data: {
              name: `RET/${purchaseOrder.name}/${String(negativeLines.length).padStart(2, '0')}`,
              companyId: session.companyId,
              pickingType: 'OUTGOING',
              partnerId: purchaseOrder.partnerId,
              locationId: inputLocation.id,
              locationDestId: supplierLocation.id,
              origin: `Return of ${purchaseOrder.name}`,
              purchaseOrderId: purchaseOrder.id,
              status: 'assigned',
              scheduledDate: new Date()
            }
          });
          for (const line of negativeLines) {
            if (!line.productId) continue;
            const product = await tx.product.findUnique({
              where: {
                id: line.productId
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
            const isSecondary = line.unitName === product?.secondaryUom && product?.hasSecondaryUnit;
            const uomFactor = isSecondary ? new Decimal(product?.secondaryUomFactor || 1) : new Decimal(1);
            const absQtyStr = Math.abs(Number(line.quantity)).toString();
            const prodAny = product as any;
            if (prodAny?.boms && prodAny.boms.length > 0 && prodAny.boms[0].type === 'kit') {
              const bom = prodAny.boms[0];
              for (const bomLine of bom.lines) {
                await tx.stockMove.create({
                  data: {
                    companyId: session.companyId,
                    pickingId: returnPicking.id,
                    productId: bomLine.componentId,
                    purchaseLineId: line.id,
                    quantity: new Decimal(absQtyStr).mul(uomFactor).mul(new Decimal(bomLine.quantity)),
                    name: `${bomLine.component.name} (Return for ${line.name})`,
                    sourceLocationId: inputLocation.id,
                    destLocationId: supplierLocation.id,
                    status: 'assigned',
                    unitName: bomLine.uom || bomLine.component.uom
                  }
                });
              }
            } else {
              await tx.stockMove.create({
                data: {
                  companyId: session.companyId,
                  pickingId: returnPicking.id,
                  productId: line.productId,
                  purchaseLineId: line.id,
                  quantity: new Decimal(absQtyStr).mul(uomFactor),
                  name: line.name || 'Return to Supplier',
                  sourceLocationId: inputLocation.id,
                  destLocationId: supplierLocation.id,
                  status: 'assigned',
                  unitName: product?.uom,
                  secQty: isSecondary ? new Decimal(absQtyStr) : new Decimal(0),
                  secUnitName: isSecondary ? line.unitName : null
                }
              });
            }
          }
        }
      }
      try {
        revalidatePath('/[locale]/purchases');
      } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
      
      await logTrackingChanges('purchaseOrder', orderId, [{
        fieldName: 'status',
        fieldDesc: 'الحالة',
        oldValue: purchaseOrder.status === 'draft' ? 'مسودة' : 'مرسل',
        newValue: 'تأكيد أمر الشراء'
      }]);

      return {
        success: true
      };
    }, { timeout: 30000 });
  } catch (error: any) {
    console.error('Error confirming purchase order:', error);
    throw error;
  }
}
export async function cancelPurchaseOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'write');
  const order = await prisma.purchaseOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      lines: true,
      invoices: true
    }
  });
  if (!order) throw new Error("أمر الشراء غير موجود");
  const hasReceived = order.lines.some(l => Number(l.qtyReceived || 0) > 0);
  const hasInvoiced = order.lines.some(l => Number(l.qtyInvoiced || 0) > 0);
  const hasActiveBills = order.invoices.some(inv => inv.state !== 'cancel');
  if (hasReceived || hasInvoiced || hasActiveBills) {
    throw new Error("مخالفة لقواعد التزامن: لا يمكن إلغاء أمر شراء له حركات مخزنية مستلمة أو فواتير. يجب تصفير المخزن وإلغاء فواتيره أولاً لكي تتمكن من إلغائه.");
  }
  await prisma.$transaction(async tx => {
    await tx.purchaseOrder.update({
      where: {
        id: orderId
      },
      data: {
        status: 'cancel'
      }
    }); // Cancel related pickings that aren't done yet
    await tx.stockPicking.updateMany({
      where: {
        purchaseOrderId: orderId,
        status: {
          not: 'done'
        }
      },
      data: {
        status: 'cancel'
      }
    });
  });
  try {
    revalidatePath('/[locale]/purchases');
  } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }

  await logTrackingChanges('purchaseOrder', orderId, [{
    fieldName: 'status',
    fieldDesc: 'الحالة',
    oldValue: order.status === 'draft' ? 'مسودة' : (order.status === 'purchase' ? 'أمر شراء' : 'غير معروف'),
    newValue: 'ملغي'
  }]);

  return {
    success: true
  };
}
export async function restorePurchaseOrderAndInventory(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'write');
  await prisma.$transaction(async tx => {
    await tx.purchaseOrder.update({
      where: {
        id: orderId
      },
      data: {
        status: 'purchase'
      }
    });
    await tx.stockPicking.updateMany({
      where: {
        purchaseOrderId: orderId,
        status: 'cancel'
      },
      data: {
        status: 'assigned'
      }
    });
    const pickings = await tx.stockPicking.findMany({
      where: {
        purchaseOrderId: orderId
      }
    });
    for (const pick of pickings) {
      await tx.stockMove.updateMany({
        where: {
          pickingId: pick.id,
          status: 'cancel'
        },
        data: {
          status: 'assigned'
        }
      });
    }
  });
  try {
    revalidatePath('/[locale]/purchases');
  } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
  return {
    success: true
  };
}
export async function setToDraftPurchaseOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'write');
  await prisma.purchaseOrder.update({
    where: {
      id: orderId
    },
    data: {
      status: 'draft'
    }
  });
  try {
    revalidatePath('/[locale]/purchases');
  } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
  return {
    success: true
  };
}
export async function createBillFromOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('account_move', 'create');
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      lines: {
        include: {
          product: true
        }
      },
      invoices: {
        include: {
          lines: true
        }
      }
    }
  });
  if (!purchaseOrder) throw new Error("أمر الشراء غير موجود");
  const billableLines = purchaseOrder.lines.map((line: any) => {
    const received = Number(line.qtyReceived || 0);
    const invoiced = Number(line.qtyInvoiced || 0);
    const billableQty = received - invoiced;
    return {
      ...line,
      billableQty
    };
  }).filter(line => line.billableQty > 0);
  if (billableLines.length === 0) {
    throw new Error("لا توجد كميات قابلة للفوترة. تأكد من استلام البضاعة أولاً.");
  }
  let billUntaxed = billableLines.reduce((sum, line) => {
    const netPrice = Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100) * (1 - Number(line.discount2 || 0) / 100);
    return sum + line.billableQty * netPrice;
  }, 0);
  const billTax = billableLines.reduce((sum, line) => {
    const netPrice = Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100) * (1 - Number(line.discount2 || 0) / 100);
    const lineTax = line.billableQty * netPrice * (Number(line.taxRate || 0) / 100);
    return sum + lineTax;
  }, 0);
  const billTotal = billUntaxed + billTax;
  const invoice = await prisma.$transaction(async tx => {
    const invoiceLinesToCreate = billableLines.map((line: any) => {
      const netPrice = Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100) * (1 - Number(line.discount2 || 0) / 100);
      const subtotal = netPrice * Number(line.billableQty);
      return {
        name: line.name,
        quantity: line.billableQty,
        priceUnit: line.priceUnit,
        priceSubtotal: subtotal,
        priceNet: subtotal,
        discount1: line.discount1 || 0,
        discount2: line.discount2 || 0,
        productId: line.productId,
        unitName: line.unitName || 'قطعة',
        lineType: 'line'
      };
    });
    const newInvoice = await tx.invoice.create({
      data: {
        name: 'مسودة',
        companyId: session.companyId,
        partnerId: purchaseOrder.partnerId,
        state: 'draft',
        type: 'in_invoice',
        dateInvoice: new Date(),
        invoiceOrigin: purchaseOrder.name,
        purchaseOrderId: purchaseOrder.id,
        amountUntaxed: billUntaxed,
        amountTax: billTax,
        amountTotal: billTotal,
        lines: {
          create: invoiceLinesToCreate
        }
      },
      include: {
        lines: true
      }
    });

    // Link taxes from purchase lines to invoice lines
    if (newInvoice.lines) {
      for (let i = 0; i < billableLines.length; i++) {
        const taxPercent = Number(billableLines[i].taxRate || 0);
        if (taxPercent > 0 && newInvoice.lines[i]) {
          const taxRecord = await tx.tax.findFirst({
            where: { amount: taxPercent }
          });
          if (taxRecord) {
            await tx.invoiceLineTax.create({
              data: {
                lineId: newInvoice.lines[i].id,
                taxId: taxRecord.id
              }
            });
          }
        }
      }
    }

    for (const line of billableLines) {
      // We no longer increment qtyInvoiced here. It will be incremented when the invoice is posted.
    }
    return newInvoice;
  }, { timeout: 30000 });
  try {
    revalidatePath('/[locale]/accounting/bills');
    revalidatePath('/[locale]/purchases');
  } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
  return invoice;
}
export async function sendToInventory(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'write');
  const order = await prisma.purchaseOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      partner: true,
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  if (!order) throw new Error("أمر الشراء غير موجود");
  if (order.status !== 'purchase') throw new Error("يجب تأكيد الأمر أولاً");
  const linesSummary = order.lines.filter(l => l.productId).map(l => `${l.name} × ${Number(l.quantity)}`).join('، ');
  await prisma.message.create({
    data: {
      body: `📦 <b>بضاعة واردة: ${order.name}</b><br/>من المورد: ${order.partner?.name || 'غير محدد'}<br/>الأصناف: ${linesSummary}`,
      type: 'notification',
      subject: 'إشعار المخزن',
      purchaseOrderId: orderId
    }
  });
  try {
    revalidatePath('/[locale]/purchases');
  } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
  return {
    success: true,
    message: 'تم إرسال الإشعار لأمين المخزن بنجاح'
  };
}
export async function duplicatePurchaseOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('purchase_order', 'create');
  const original = await prisma.purchaseOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      lines: true
    }
  });
  if (!original) throw new Error("أمر الشراء غير موجود");
  return await prisma.$transaction(async tx => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const countThisMonth = await tx.purchaseOrder.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });
    const seqNum = String(countThisMonth + 1).padStart(5, '0');
    const orderName = `P${seqNum}`;
    const newOrder = await tx.purchaseOrder.create({
      data: {
        name: orderName,
        companyId: session.companyId,
        partnerId: original.partnerId,
        priceListId: original.priceListId,
        dateOrder: now,
        status: 'draft',
        createdById: session.userId,
        updatedById: session.userId,
        amountUntaxed: original.amountUntaxed,
        amountTax: original.amountTax,
        amountTotal: original.amountTotal,
        lines: {
          create: original.lines.map((line: any, i: number) => ({
            productId: line.productId || undefined,
            name: line.name,
            sequence: (i + 1) * 10,
            quantity: line.quantity,
            priceUnit: line.priceUnit,
            discount1: line.discount1,
            priceSubtotal: line.priceSubtotal,
            accountId: line.accountId || null,
            unitName: line.unitName,
            secondaryQuantity: line.secondaryQuantity,
            secondaryUnit: line.secondaryUnit,
            appliedPriceListName: line.appliedPriceListName
          }))
        }
      }
    });
    try {
      revalidatePath('/[locale]/purchases');
    } catch (error) { console.error("Silent error caught in app/actions/purchases.ts:", error); }
    return newOrder;
  });
}