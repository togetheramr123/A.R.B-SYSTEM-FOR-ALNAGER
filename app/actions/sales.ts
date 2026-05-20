"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ensureAccess, checkAccess } from '@/lib/access';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';
import { fail } from '@/lib/actionResult';
import { CreateSaleOrderSchema, validateSafe } from '@/lib/validations';
import { getNextSequence } from '@/lib/sequence';
import { reserveStock, releaseReservedStock } from '@/lib/utils/inventoryReservation';
import { logTrackingChanges, TrackingChange } from '@/app/actions/chatter';
export async function createSaleOrder(data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'create');
  const validation = validateSafe(CreateSaleOrderSchema, data);
  if (!validation.success) return fail(validation.error);
  // Ensure lines is valid and filter empty placeholder rows
  if (!data.lines || !Array.isArray(data.lines)) data.lines = [];
  data.lines = data.lines.filter((line: any) => line.productId || (line.id && line.id !== ''));
  const lines = data.lines.map((line: any) => ({
    ...line,
    qty: new Decimal(line.qty || 0),
    price: new Decimal(line.price || 0),
    discount: new Decimal(line.discount || 0),
    tax: new Decimal(line.tax || 0)
  }));
  const amountUntaxed = lines.reduce((sum: Decimal, line: any) => {
    const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100))).mul(new Decimal(1).minus(new Decimal(line.discount2 || 0).div(100)));
    return sum.plus(subtotal);
  }, new Decimal(0));
  const amountTotal = lines.reduce((sum: Decimal, line: any) => {
    const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100))).mul(new Decimal(1).minus(new Decimal(line.discount2 || 0).div(100)));
    const taxAmount = subtotal.mul(line.tax.div(100));
    return sum.plus(subtotal).plus(taxAmount);
  }, new Decimal(0));
  return await prisma.$transaction(async tx => {
    let foundPartner = null;
    const potentialId = data.partnerId || data.vendor || data.customer;
    if (potentialId && potentialId.length >= 24) {
      await tx.partner.findUnique({
        where: { id: potentialId }
      }).catch(() => null);
    }
    let partner = foundPartner || (await tx.partner.findFirst({
      where: { name: { contains: potentialId || '' } }
    }));
    
    if (!partner && potentialId) { 
        partner = await tx.partner.create({ 
            data: { 
                name: potentialId,
                isCustomer: true,
                companyId: session.companyId
            } 
        });
    }

    const orderName = await getNextSequence('sale.order', tx);
    const saleOrder = await tx.saleOrder.create({
      data: {
        name: orderName,
        companyId: session.companyId,
        partnerId: partner?.id || null,
        priceListId: data.priceListId || null,
        dateOrder: new Date(data.date),
        status: 'draft',
        createdById: session.userId,
        updatedById: session.userId,
        amountUntaxed: amountUntaxed,
        amountTotal: amountTotal,
        lines: {
          create: await Promise.all(data.lines.map(async (line: any, i: number) => {
            const product = line.productId ? await tx.product.findUnique({
              where: { id: line.productId }
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
              unitName: isSecondary ? product?.secondaryUom : product?.uom,
              secondaryQuantity: new Decimal(line.secondaryQty || 0),
              secondaryUnit: product?.hasSecondaryUnit ? product?.secondaryUom : null,
              appliedPriceListName: line.appliedPriceListName || null,
              taxRate: new Decimal(line.tax || 0)
            };
          }))
        }
      }
    });

    try {
      revalidatePath('/[locale]/sales');
    } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }

    return saleOrder;
  });
}
export async function createDraftSaleOrder() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'create');
  return await prisma.$transaction(async tx => {
    // Generate sequential monthly name
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const countThisMonth = await tx.saleOrder.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });
    const seqNum = String(countThisMonth + 1).padStart(5, '0');
    const orderName = `S${seqNum}`;
    const saleOrder = await tx.saleOrder.create({
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
        body: `قام <b>${user?.name || 'النظام'}</b> بإنشاء مسودة عرض سعر.`,
        type: 'notification',
        subject: user?.name || 'System',
        saleOrderId: saleOrder.id
      }
    });
    return saleOrder;
  });
}
export async function updateSaleOrder(orderId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write'); // Calculate totals using Decimal for precision
  // Ensure lines is valid and filter empty placeholder rows
  if (!data.lines || !Array.isArray(data.lines)) data.lines = [];
  data.lines = data.lines.filter((line: any) => line.productId || (line.id && line.id !== ''));
  const lines = data.lines.map((line: any) => ({
    ...line,
    qty: new Decimal(line.qty || 0),
    price: new Decimal(line.price || 0),
    discount: new Decimal(line.discount || 0),
    discount2: new Decimal(line.discount2 || 0),
    tax: new Decimal(line.tax || 0)
  }));
  const amountUntaxed = lines.reduce((sum: Decimal, line: any) => {
    const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100))).mul(new Decimal(1).minus(line.discount2.div(100)));
    return sum.plus(subtotal);
  }, new Decimal(0));
  const amountTotal = lines.reduce((sum: Decimal, line: any) => {
    const subtotal = line.qty.mul(line.price).mul(new Decimal(1).minus(line.discount.div(100))).mul(new Decimal(1).minus(line.discount2.div(100)));
    const taxAmount = subtotal.mul(line.tax.div(100));
    return sum.plus(subtotal).plus(taxAmount);
  }, new Decimal(0));
  const txResult = await prisma.$transaction(async tx => {
    const current = await tx.saleOrder.findUnique({
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
    if (data.partnerId) {
      partner = await tx.partner.findUnique({
        where: {
          id: data.partnerId
        }
      }).catch(() => null);
    }
    const existingLines = await tx.saleOrderLine.findMany({
      where: {
        orderId
      }
    });
    const existingLineIds = existingLines.map((l: any) => l.id);
    const incomingLineIds = data.lines.map((l: any) => l.id).filter(Boolean);
    const linesToDelete = existingLineIds.filter((id: string) => !incomingLineIds.includes(id));
    if (linesToDelete.length > 0) {
      await tx.saleOrderLine.deleteMany({
        where: {
          id: {
            in: linesToDelete
          }
        }
      });
    }
    const saleOrder = await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        partnerId: partner?.id || null,
        priceListId: data.priceListId || null,
        dateOrder: new Date(data.date),
        updatedById: session.userId,
        amountUntaxed: amountUntaxed,
        amountTotal: amountTotal
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
        unitName: isSecondary ? product?.secondaryUom : product?.uom,
        secondaryQuantity: new Decimal(line.secondaryQty || 0),
        secondaryUnit: product?.hasSecondaryUnit ? product?.secondaryUom : null,
        appliedPriceListName: line.appliedPriceListName || null,
        taxRate: new Decimal(line.tax || 0)
      };
      if (line.id && existingLineIds.includes(line.id)) {
        await tx.saleOrderLine.update({
          where: {
            id: line.id
          },
          data: lineData
        });
      } else {
        await tx.saleOrderLine.create({
          data: {
            ...lineData,
            orderId: orderId
          }
        });
      }
    }
    try {
      revalidatePath('/[locale]/sales');
      revalidatePath(`/[locale]/sales/${orderId}`);
    } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
    return {
      saleOrder,
      existingLines,
      current
    };
  }); // ------------------------------------------------------------- // Audit Trail: Log changes in Chatter after successful transaction // -------------------------------------------------------------
  const changes: TrackingChange[] = [];
  const {
    saleOrder,
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
    await logTrackingChanges('saleOrder', orderId, changes);
  }
  return {
    success: true
  };
}
export async function confirmSaleOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  try {
    await prisma.$transaction(async tx => {
      const saleOrder = await tx.saleOrder.findUnique({
        where: {
          id: orderId
        },
        include: {
          lines: {
            include: {
              product: true
            }
          }
        }
      });
      if (!saleOrder) throw new Error("Order not found");
      if (saleOrder.status !== 'draft' && saleOrder.status !== 'sent') throw new Error("Order already confirmed");
      const outOfStockItems: any[] = [];
      for (const line of saleOrder.lines) {
        if (!line.productId) continue;
        const product = await tx.product.findUnique({
          where: {
            id: line.productId
          },
          include: {
            boms: {
              include: {
                lines: true
              }
            }
          }
        });
        if (product?.type === 'service') continue;
        const isSecondary = line.unitName === product?.secondaryUom && product?.hasSecondaryUnit;
        const uomFactor = isSecondary ? new Decimal(product?.secondaryUomFactor || 1) : new Decimal(1); // If it's a kit, check stock for its components
        const prodAny = product as any;
        if (prodAny?.boms && prodAny.boms.length > 0 && prodAny.boms[0].type === 'kit') {
          const bom = prodAny.boms[0];
          for (const bomLine of bom.lines) {
            const componentProduct = await tx.product.findUnique({
              where: {
                id: bomLine.componentId
              }
            });
            if (componentProduct?.type === 'service') continue;
            const quants = await tx.stockQuant.findMany({
              where: {
                productId: bomLine.componentId,
                location: {
                  type: 'internal'
                }
              }
            });
            const totalQty = quants.reduce((acc, q) => acc.plus(new Decimal(q.quantity)), new Decimal(0));
            const requestedQty = new Decimal(line.quantity).mul(uomFactor).mul(new Decimal(bomLine.quantity));
            if (totalQty.lt(requestedQty)) {
              outOfStockItems.push({
                name: componentProduct?.name || 'Unknown Component',
                qtyAvailable: totalQty.toNumber(),
                qtyRequested: requestedQty.toNumber(),
                kitName: line.name
              });
            }
          }
        } else {
          const quants = await tx.stockQuant.findMany({
            where: {
              productId: line.productId,
              location: {
                type: 'internal'
              }
            }
          });
          const totalQty = quants.reduce((acc, q) => acc.plus(new Decimal(q.quantity)), new Decimal(0));
          const requestedQty = new Decimal(line.quantity).mul(uomFactor);
          if (totalQty.lt(requestedQty)) {
            outOfStockItems.push({
              name: line.name,
              qtyAvailable: totalQty.toNumber(),
              qtyRequested: requestedQty.toNumber()
            });
          }
        }
      }
      if (outOfStockItems.length > 0) {
        if (saleOrder.approvalStatus === 'rejected') {
          const req = await tx.approvalRequest.findFirst({
            where: { resourceId: orderId, type: 'negative_stock', status: 'rejected' },
            orderBy: { createdAt: 'desc' }
          });
          let reason = "غير محدد";
          if (req?.details) {
            try { const d = JSON.parse(req.details); if (d.rejectReason) reason = d.rejectReason; } catch(e) {}
          }
          const date = req?.updatedAt ? req.updatedAt.toLocaleDateString('ar-EG') : 'سابقاً';
          throw new Error(`PREVIOUSLY_REJECTED: ${JSON.stringify({ date, reason })}`);
        }
        if (session.role === 'ADMIN' || saleOrder.approvalStatus === 'approved') {
          if (session.role === 'ADMIN' && saleOrder.approvalStatus !== 'approved') {
            await tx.message.create({
              data: {
                saleOrderId: orderId,
                body: `قام المدير ${session.name || ''} بتأكيد الطلب بصرف مخزني سالب مباشرة.`,
                subtype: "mt_comment"
              }
            });
          } else {
            const admins = await tx.user.findMany({
              where: {
                role: 'ADMIN',
                companyId: session.companyId
              }
            });
            for (const admin of admins) {
              await tx.notification.create({
                data: {
                  title: '🔴 صرف بالسالب: ' + saleOrder.name,
                  message: `تم صرف أصناف بالسالب في أمر البيع ${saleOrder.name}. يجب تعويض المخزن عاجلاً:\n${outOfStockItems.map(i => `- ${i.name} (المطلوب: ${i.qtyRequested}, المتاح: ${i.qtyAvailable})`).join('\n')}`,
                  type: 'URGENT',
                  userId: admin.id,
                  linkUrl: `/ar/sales/${orderId}`,
                  resourceId: orderId,
                  resourceModel: 'SaleOrder',
                  companyId: session.companyId
                }
              });
            }
          }
        } else {
          throw new Error(`NEGATIVE_STOCK: ${JSON.stringify(outOfStockItems)}`);
        }
      }
      await tx.saleOrder.update({
        where: {
          id: orderId
        },
        data: {
          status: 'sale'
        }
      });
      const customerLocation = await tx.location.findFirst({
        where: {
          type: 'customer'
        }
      });
      const outputLocation = await tx.location.findFirst({
        where: {
          type: 'internal'
        }
      });
      if (outputLocation && customerLocation) {
        const storableLines = saleOrder.lines.filter((l: any) => l.product && l.product.type === 'storable');
        const positiveLines = storableLines.filter((l: any) => Number(l.quantity) > 0);
        const negativeLines = storableLines.filter((l: any) => Number(l.quantity) < 0);
        if (positiveLines.length > 0) {
          const picking = await tx.stockPicking.create({
            data: {
              name: `WH/OUT/${saleOrder.name}/${String(positiveLines.length).padStart(2, '0')}`,
              companyId: session.companyId,
              pickingType: 'OUTGOING',
              partnerId: saleOrder.partnerId,
              locationId: outputLocation.id,
              locationDestId: customerLocation.id,
              origin: saleOrder.name,
              status: 'assigned',
              scheduledDate: new Date(),
              saleOrderId: saleOrder.id
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
                    quantity: new Decimal(line.quantity).mul(uomFactor).mul(new Decimal(bomLine.quantity)),
                    saleLineId: line.id,
                    name: `${bomLine.component.name} (for ${line.name})`,
                    sourceLocationId: outputLocation.id,
                    destLocationId: customerLocation.id,
                    status: 'assigned',
                    unitName: bomLine.uom || bomLine.component.uom
                  }
                });
                await reserveStock(tx, session.companyId, bomLine.componentId, outputLocation.id, new Decimal(line.quantity).mul(uomFactor).mul(new Decimal(bomLine.quantity)));
              }
            } else {
              await tx.stockMove.create({
                data: {
                  companyId: session.companyId,
                  pickingId: picking.id,
                  productId: line.productId,
                  quantity: new Decimal(line.quantity).mul(uomFactor),
                  saleLineId: line.id,
                  name: line.name || 'Product Delivery',
                  sourceLocationId: outputLocation.id,
                  destLocationId: customerLocation.id,
                  status: 'assigned',
                  unitName: product?.uom,
                  secQty: isSecondary ? new Decimal(line.quantity) : new Decimal(0),
                  secUnitName: isSecondary ? line.unitName : null
                }
              });
              await reserveStock(tx, session.companyId, line.productId, outputLocation.id, new Decimal(line.quantity).mul(uomFactor));
            }
          }
        }
        if (negativeLines.length > 0) {
          const returnPicking = await tx.stockPicking.create({
            data: {
              name: `RET/${saleOrder.name}/${String(negativeLines.length).padStart(2, '0')}`,
              companyId: session.companyId,
              pickingType: 'INCOMING'
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
                    quantity: new Decimal(absQtyStr).mul(uomFactor).mul(new Decimal(bomLine.quantity)),
                    saleLineId: line.id,
                    name: `${bomLine.component.name} (Return for ${line.name})`,
                    sourceLocationId: customerLocation.id,
                    destLocationId: outputLocation.id,
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
                  quantity: new Decimal(absQtyStr).mul(uomFactor),
                  saleLineId: line.id,
                  name: line.name || 'Sales Return',
                  sourceLocationId: customerLocation.id,
                  destLocationId: outputLocation.id,
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
      const orderCreator = await tx.user.findUnique({
        where: {
          id: session.userId
        },
        select: {
          name: true
        }
      });
      const partner = saleOrder.partnerId ? await tx.partner.findUnique({
        where: {
          id: saleOrder.partnerId
        },
        select: {
          name: true
        }
      }) : null;
      const admins = await tx.user.findMany({
        where: {
          role: 'ADMIN',
          companyId: session.companyId
        }
      });
      for (const admin of admins) {
        if (admin.id === session.userId) continue;
        await tx.notification.create({
          data: {
            userId: admin.id,
            title: `📦 طلب جديد يحتاج تجهيز: ${saleOrder.name}`,
            message: `${orderCreator?.name || 'مندوب المبيعات'} أكّد عرض السعر ${saleOrder.name} للعميل ${partner?.name || '—'}. يرجى تجهيز وصرف البضاعة من المخزن.`,
            type: 'INFO',
            senderId: session.userId,
            linkUrl: `/ar/inventory/transfers`,
            resourceId: orderId,
            resourceModel: 'SaleOrder',
            companyId: session.companyId
          }
        });
      }
      try {
        revalidatePath('/[locale]/sales');
      } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
      
      await logTrackingChanges('saleOrder', orderId, [{
        fieldName: 'status',
        fieldDesc: 'الحالة',
        oldValue: saleOrder.status === 'draft' ? 'مسودة' : 'مرسل',
        newValue: 'تأكيد أمر البيع'
      }]);

      return {
        success: true
      };
    });
  } catch (error: any) {
    if (error.message.includes('NEGATIVE_STOCK')) {
      return {
        error: 'NEGATIVE_STOCK',
        items: error.message.replace('NEGATIVE_STOCK: ', '')
      };
    }
    throw error;
  }
}
export async function requestNegativeStockApproval(orderId: string, details?: any, adminId?: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  const saleOrder = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      partner: true
    }
  });
  if (!saleOrder) throw new Error("Order not found");
  
  let targetAdminName = "الإدارة";

  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        approvalStatus: 'pending_approval'
      }
    });
    const approvalRequest = await tx.approvalRequest.create({
      data: {
        type: 'negative_stock',
        status: 'pending',
        requesterId: session.userId,
        resourceId: orderId,
        resourceModel: 'SaleOrder',
        details: details ? JSON.stringify(details) : null,
        companyId: session.companyId
      }
    });
    
    let adminsToNotify = [];
    if (adminId) {
      const specificAdmin = await tx.user.findUnique({ where: { id: adminId } });
      if (specificAdmin) {
        adminsToNotify.push(specificAdmin);
        targetAdminName = specificAdmin.name || "المدير";
      }
    } 
    
    if (adminsToNotify.length === 0) {
      adminsToNotify = await tx.user.findMany({
        where: {
          role: 'ADMIN',
          companyId: session.companyId
        }
      });
    }

    let detailedMessage = `المستخدم ${session.name || session.email} يطلب الموافقة على الصرف بالسالب لعرض سعر ${saleOrder.name}`;
    if (saleOrder.partner) {
      detailedMessage += ` للعميل ${saleOrder.partner.name}.`;
    }
    if (details && Array.isArray(details)) {
      detailedMessage += `\nالأصناف:\n${details.map(i => `- ${i.name} (المطلوب: ${i.qtyRequested}, المتاح: ${i.qtyAvailable})`).join('\n')}`;
    }

    for (const admin of adminsToNotify) {
      await tx.notification.create({
        data: {
          title: 'طلب موافقة الصرف بالسالب',
          message: detailedMessage,
          type: 'approval_request',
          userId: admin.id,
          senderId: session.userId,
          linkUrl: `/${session.companyId ? 'ar' : 'ar'}/sales/${orderId}`,
          resourceId: approvalRequest.id,
          resourceModel: 'ApprovalRequest',
          companyId: session.companyId
        }
      });
    }
    await tx.message.create({
      data: {
        saleOrderId: orderId,
        body: `تم إرسال طلب الصرف بالسالب إلى ${targetAdminName} للموافقة.`,
        subtype: "mt_comment"
      }
    });
  });
  try {
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return {
    success: true
  };
}
export async function approveNegativeStock(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  const saleOrder = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    }
  });
  if (!saleOrder) throw new Error("Order not found");
  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        approvalStatus: 'approved'
      }
    });
    const approvalRequest = await tx.approvalRequest.findFirst({
      where: {
        resourceId: orderId,
        resourceModel: 'SaleOrder',
        status: 'pending',
        type: 'negative_stock'
      }
    });
    if (approvalRequest) {
      await tx.approvalRequest.update({
        where: {
          id: approvalRequest.id
        },
        data: {
          status: 'approved',
          approverId: session.userId
        }
      });
      await tx.notification.create({
        data: {
          title: 'تمت الموافقة على الصرف بالسالب',
          message: `تمت الموافقة على أمر البيع ${saleOrder.name}. يمكنك الآن تأكيد الطلب.`,
          type: 'info',
          userId: approvalRequest.requesterId,
          senderId: session.userId,
          linkUrl: `/${session.companyId ? 'ar' : 'ar'}/sales/${orderId}`,
          resourceId: orderId,
          resourceModel: 'SaleOrder',
          companyId: session.companyId
        }
      });
      
      await tx.notification.updateMany({
        where: {
          resourceId: approvalRequest.id,
          type: 'approval_request'
        },
        data: {
          isAcknowledged: true
        }
      });
      
      let itemsLog = "";
      if (approvalRequest.details) {
        try {
          const items = JSON.parse(approvalRequest.details);
          itemsLog = items.map((i: any) => `- البند: ${i.name} | الكمية: ${i.qtyRequested}`).join('\\n');
        } catch (e) {}
      }
      
      await tx.message.create({
        data: {
          saleOrderId: orderId,
          body: `المدير ${session.name || ''} وافق على طلب المستخدم بالصرف بسالب:\\n${itemsLog}`,
          subtype: "mt_comment"
        }
      });
    } else {
      await tx.message.create({
        data: {
          saleOrderId: orderId,
          body: `تمت الموافقة على الصرف بالسالب بواسطة ${session.name || 'المدير'}.`,
          subtype: "mt_comment"
        }
      });
    }
  });
  try {
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return {
    success: true
  };
}

export async function rejectNegativeStock(orderId: string, reason?: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  const saleOrder = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    }
  });
  if (!saleOrder) throw new Error("Order not found");
  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        approvalStatus: 'rejected'
      }
    });
    const approvalRequest = await tx.approvalRequest.findFirst({
      where: {
        resourceId: orderId,
        resourceModel: 'SaleOrder',
        status: 'pending',
        type: 'negative_stock'
      }
    });
    if (approvalRequest) {
      let detailsObj = {};
      if (approvalRequest.details) {
        try { detailsObj = JSON.parse(approvalRequest.details); } catch(e) {}
      }
      if (reason) {
        (detailsObj as any).rejectReason = reason;
      }
      await tx.approvalRequest.update({
        where: {
          id: approvalRequest.id
        },
        data: {
          status: 'rejected',
          approverId: session.userId,
          details: JSON.stringify(detailsObj)
        }
      });
      await tx.notification.create({
        data: {
          title: 'تم رفض طلب الصرف بالسالب',
          message: `المدير رفض طلب الصرف بالسالب لأمر البيع ${saleOrder.name}.` + (reason ? `\nالسبب: ${reason}` : ''),
          type: 'error',
          userId: approvalRequest.requesterId,
          senderId: session.userId,
          linkUrl: `/${session.companyId ? 'ar' : 'ar'}/sales/${orderId}`,
          resourceId: orderId,
          resourceModel: 'SaleOrder',
          companyId: session.companyId
        }
      });
      await tx.notification.updateMany({
        where: {
          resourceId: approvalRequest.id,
          type: 'approval_request'
        },
        data: {
          isAcknowledged: true
        }
      });
    }
    await tx.message.create({
      data: {
        saleOrderId: orderId,
        body: `قام المدير ${session.name || ''} برفض طلب الصرف بالسالب.`,
        subtype: "mt_comment"
      }
    });
  });
  try {
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return {
    success: true
  };
}

export async function approveNegativeStockByRequestId(requestId: string) {
  const req = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
  if (!req || !req.resourceId) throw new Error("Request not found");
  return await approveNegativeStock(req.resourceId);
}

export async function rejectNegativeStockByRequestId(requestId: string, reason?: string) {
  const req = await prisma.approvalRequest.findUnique({ where: { id: requestId } });
  if (!req || !req.resourceId) throw new Error("Request not found");
  return await rejectNegativeStock(req.resourceId, reason);
}
export async function createInvoiceFromOrder(orderId: string, options?: {
  type?: 'regular' | 'down_payment_percentage' | 'down_payment_fixed';
  percentage?: number;
  fixedAmount?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('account_move', 'create');
  const saleOrder = await prisma.saleOrder.findUnique({
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
  if (!saleOrder) throw new Error("Order not found");
  const now = new Date();
  const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const invoiceCount = await prisma.invoice.count({
    where: {
      type: 'out_invoice',
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth(), 1)
      }
    }
  });
  const invSeq = String(invoiceCount + 1).padStart(4, '0');
  if (options?.type && options.type !== 'regular') {
    const isPercentage = options.type === 'down_payment_percentage';
    const dpAmount = isPercentage ? Number(saleOrder.amountUntaxed) * (options.percentage || 100) / 100 : options.fixedAmount || 0;
    if (dpAmount <= 0) throw new Error("قيمة الدفعة المقدمة غير صالحة ولا يمكن أن تكون صفراً.");
    const invoice = await prisma.$transaction(async tx => {
      const newInvoice = await tx.invoice.create({
        data: {
          name: 'مسودة',
          companyId: session.companyId,
          partnerId: saleOrder.partnerId,
          state: 'draft',
          type: 'out_invoice',
          dateInvoice: new Date(),
          invoiceOrigin: saleOrder.name,
          saleOrderId: saleOrder.id,
          amountUntaxed: dpAmount,
          amountTax: 0,
          amountTotal: dpAmount,
          lines: {
            create: [{
              name: 'دفعة مقدمة (Down Payment)',
              quantity: 1,
              priceUnit: dpAmount,
              priceSubtotal: dpAmount,
              lineType: 'down_payment'
            }]
          }
        }
      });
      return newInvoice;
    });
    try {
      revalidatePath('/[locale]/accounting/invoices');
      revalidatePath('/[locale]/sales');
    } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
    return invoice;
  }
  const billableLines = saleOrder.lines.map((line: any) => {
    const delivered = Number(line.qtyDelivered || 0);
    const invoiced = Number(line.qtyInvoiced || 0);
    const baseQty = delivered;
    const billableQty = baseQty - invoiced;
    return {
      ...line,
      billableQty
    };
  }).filter(line => line.billableQty > 0);
  if (billableLines.length === 0) {
    throw new Error("لا توجد كميات قابلة للفوترة. تأكد من تسليم البضاعة أو سياسة الفوترة (مسلمة vs مطلوبة).");
  }
  let totalDownPaymentBilled = 0;
  if (saleOrder.invoices) {
    for (const inv of saleOrder.invoices) {
      const dpLines = inv.lines.filter(l => l.lineType === 'down_payment');
      const dpSum = dpLines.reduce((sum, l) => sum + Number(l.priceSubtotal), 0);
      totalDownPaymentBilled += dpSum;
    }
  }
  let previouslyDeductedDP = 0;
  if (saleOrder.invoices) {
    for (const inv of saleOrder.invoices) {
      const dpDeductionLines = inv.lines.filter(l => l.lineType === 'down_payment_deduction');
      const deductionSum = dpDeductionLines.reduce((sum, l) => sum + Math.abs(Number(l.priceSubtotal)), 0);
      previouslyDeductedDP += deductionSum;
    }
  }
  const remainingDPTobeDeducted = totalDownPaymentBilled - previouslyDeductedDP;
  let billUntaxed = billableLines.reduce((sum: number, line: any) => {
    const netPrice = Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100) * (1 - Number(line.discount2 || 0) / 100);
    return sum + line.billableQty * netPrice;
  }, 0);
  const billTax = billableLines.reduce((sum, line) => {
    const netPrice = Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100) * (1 - Number(line.discount2 || 0) / 100);
    const lineTax = line.billableQty * netPrice * (Number(line.taxRate || 0) / 100);
    return sum + lineTax;
  }, 0);
  let deductionLine = null;
  if (remainingDPTobeDeducted > 0) {
    billUntaxed -= remainingDPTobeDeducted;
    deductionLine = {
      name: 'خصم دفعة مقدمة',
      quantity: -1,
      priceUnit: remainingDPTobeDeducted,
      priceSubtotal: -remainingDPTobeDeducted,
      lineType: 'down_payment_deduction'
    };
  }
  const billTotal = billUntaxed + billTax;
  const invoice = await prisma.$transaction(async tx => {
    const invoiceLinesToCreate = billableLines.map((line: any) => ({
      name: line.name,
      quantity: line.billableQty,
      priceUnit: line.priceUnit,
      priceSubtotal: Number(line.priceUnit) * (1 - Number(line.discount1 || 0) / 100) * Number(line.billableQty),
      discount1: line.discount1 || 0,
      productId: line.productId,
      lineType: 'line'
    }));
    if (deductionLine) {
      invoiceLinesToCreate.push(deductionLine as any);
    }
    const newInvoice = await tx.invoice.create({
      data: {
        name: 'مسودة',
        companyId: session.companyId,
        partnerId: saleOrder.partnerId,
        state: 'draft',
        type: 'out_invoice',
        dateInvoice: new Date(),
        invoiceOrigin: saleOrder.name,
        saleOrderId: saleOrder.id,
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
    if (newInvoice.lines) {
      for (let i = 0; i < billableLines.length; i++) {
        const taxPercent = Number(billableLines[i].taxRate || 0);
        if (taxPercent > 0 && newInvoice.lines[i]) {
          const taxRecord = await tx.tax.findFirst({
            where: {
              amount: taxPercent
            }
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
      for (const line of billableLines) {
        // We no longer increment qtyInvoiced here. It will be incremented when the invoice is posted.
        // This ensures draft invoices don't falsely mark quantities as invoiced.
      }
    }
    return newInvoice;
  });
  try {
    revalidatePath('/[locale]/accounting/invoices');
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return invoice;
}
export async function cancelSaleOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      lines: true,
      invoices: true
    }
  });
  if (!order) throw new Error("أمر البيع غير موجود");
  const hasDelivered = order.lines.some(l => Number(l.qtyDelivered || 0) > 0);
  const hasInvoiced = order.lines.some(l => Number(l.qtyInvoiced || 0) > 0);
  const hasActiveBills = order.invoices.some(inv => inv.state !== 'cancel');
  if (hasDelivered || hasInvoiced || hasActiveBills) {
    throw new Error("مخالفة لقواعد التزامن: لا يمكن إلغاء أمر بيع له بضاعة مسلمة أو فواتير. يجب تصفير تسليمات المخزن وإلغاء فواتيره أولاً لكي تتمكن من إلغائه.");
  }
  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        status: 'cancel'
      }
    });
    const pickingsToCancel = await tx.stockPicking.findMany({
      where: {
        saleOrderId: orderId,
        status: {
          not: 'done'
        }
      },
      include: {
        moves: true
      }
    });
    for (const picking of pickingsToCancel) {
      for (const move of picking.moves) {
        if ((move.status === 'assigned' || move.status === 'waiting') && move.productId && move.companyId) {
          await releaseReservedStock(tx, move.companyId, move.productId, move.sourceLocationId!, new Decimal(move.quantity));
        }
      }
      await tx.stockMove.updateMany({
        where: {
          pickingId: picking.id
        },
        data: {
          status: 'cancel'
        }
      });
      await tx.stockPicking.update({
        where: {
          id: picking.id
        },
        data: {
          status: 'cancel'
        }
      });
    }
  });
  try {
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  
  await logTrackingChanges('saleOrder', orderId, [{
    fieldName: 'status',
    fieldDesc: 'الحالة',
    oldValue: order.status === 'draft' ? 'مسودة' : (order.status === 'sale' ? 'أمر بيع' : 'غير معروف'),
    newValue: 'ملغي'
  }]);

  return {
    success: true
  };
}
export async function restoreSaleOrderAndInventory(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        status: 'sale'
      }
    });
    await tx.stockPicking.updateMany({
      where: {
        saleOrderId: orderId,
        status: 'cancel'
      },
      data: {
        status: 'assigned'
      }
    });
    const pickings = await tx.stockPicking.findMany({
      where: {
        saleOrderId: orderId
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
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return {
    success: true
  };
}
export async function setToDraftSaleOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      lines: true,
      invoices: true
    }
  });
  if (!order) throw new Error("أمر البيع غير موجود");
  const hasDelivered = order.lines.some(l => Number(l.qtyDelivered || 0) > 0);
  const hasInvoiced = order.lines.some(l => Number(l.qtyInvoiced || 0) > 0);
  const hasActiveBills = order.invoices.some(inv => inv.state !== 'cancel');
  if (hasDelivered || hasInvoiced || hasActiveBills) {
    throw new Error("مخالفة لقواعد التزامن: لا يمكن إلغاء أمر بيع له بضاعة مسلمة أو فواتير. يجب تصفير تسليمات المخزن وإلغاء فواتيره أولاً لكي تتمكن من إلغائه.");
  }
  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        status: 'cancel'
      }
    });
    const pickingsToCancel = await tx.stockPicking.findMany({
      where: {
        saleOrderId: orderId,
        status: {
          not: 'done'
        }
      },
      include: {
        moves: true
      }
    });
    for (const picking of pickingsToCancel) {
      for (const move of picking.moves) {
        if (move.status === 'assigned' || move.status === 'waiting') {
          await releaseReservedStock(tx, session.companyId, move.productId as string, move.sourceLocationId as string, new Decimal(move.quantity));
        }
      }
    }
    await tx.stockPicking.updateMany({
      where: {
        saleOrderId: orderId,
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
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return {
    success: true
  };
}
export async function requestZeroPriceApproval(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess('sale_order', 'write');
  await prisma.saleOrder.update({
    where: {
      id: orderId
    },
    data: {
      approvalStatus: 'pending'
    }
  });
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    },
    select: {
      name: true
    }
  });
  await prisma.approvalRequest.create({
    data: {
      type: 'zero_price_sale',
      status: 'pending',
      requesterId: session.userId,
      resourceId: orderId,
      resourceModel: 'SaleOrder',
      details: JSON.stringify({
        orderName: order?.name || 'Unknown'
      }),
      companyId: session.companyId
    }
  });
  await prisma.message.create({
    data: {
      saleOrderId: orderId,
      body: "تم إرسال طلب اعتماد من الإدارة لوجود أصناف بسعر صفر.",
      subtype: "mt_comment"
    }
  });
  try {
    revalidatePath('/[locale]/sales');
  } catch (error) { console.error("Silent error caught in app/actions/sales.ts:", error); }
  return {
    success: true
  };
}
export async function fetchPurchaseInvoiceForSales(invoiceRef: string, mode: 'full' | 'items_only' = 'full') {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("sale_order", "read");
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        { name: { contains: invoiceRef } },
        { paymentReference: { contains: invoiceRef } }
      ]
    },
    include: {
      lines: {
        include: {
          product: true
        }
      },
      partner: true
    }
  });
  if (!invoice) {
    return {
      error: `لم يتم العثور على فاتورة مشتريات بالرقم: ${invoiceRef}`
    };
  }
  const lines = invoice.lines.map((line: any) => {
    const base = {
      productId: line.productId || '',
      description: line.name || line.product?.name || '',
      qty: Number(line.quantity) || 1,
      uom: line.unitName || line.product?.uom || 'قطعة',
      tax: Number(line.product?.taxes) || 14,
      secondaryQty: Number(line.secondaryQuantity) || 0,
      secondaryUnit: line.secondaryUnit || line.product?.secondaryUom || ''
    };
    if (mode === 'full') {
      return {
        supplierName: invoice.partner?.name || ''
      };
    }
    return {
      ...base,
      costPrice: 0,
      discount: 0
    };
  });
  return {
    success: true,
    invoice: {
      id: invoice.id,
      name: invoice.name,
      origin: invoice.invoiceOrigin || '',
      supplierName: invoice.partner?.name || '',
      date: invoice.dateInvoice,
      total: mode === 'full' ? Number(invoice.amountTotal) : undefined
    },
    lines
  };
}
export async function requestReservation(orderId: string, hours: number) {
  const session = await getSession();
  if (!session?.userId) throw new Error("غير مصرح");
  await ensureAccess("sale_order", "read");
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    }
  });
  if (!order) throw new Error("العرض غير موجود");
  if (order.status !== 'draft' && order.status !== 'sent') {
    throw new Error("لا يمكن طلب الحجز إلا لعروض الأسعار (Draft/Sent).");
  }
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  await prisma.$transaction(async tx => {
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        reservationState: 'pending_approval',
        reservationExpiresAt: expiresAt
      }
    });
    await tx.approvalRequest.create({
      data: {
        type: 'reservation_request',
        status: 'pending',
        requesterId: session.userId,
        resourceId: orderId,
        resourceModel: 'SaleOrder',
        details: JSON.stringify({
          hours,
          expiresAt: expiresAt.toISOString()
        }),
        companyId: session.companyId
      }
    });
  });
  revalidatePath(`/[locale]/sales/${orderId}`);
  return {
    success: true
  };
}
export async function approveReservation(orderId: string) {
  const session = await getSession();
  if (!session?.userId) throw new Error("غير مصرح");
  await ensureAccess("sale_order", "read");
  const userGroups = await prisma.resGroup.findMany({
    where: {
      users: {
        some: {
          id: session.userId
        }
      }
    }
  });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || userGroups.some(g => g.name.toLowerCase().includes('manager'));
  if (!isManager) {
    throw new Error("صلاحيات غير كافية للموافقة على الحجز.");
  }
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      lines: true
    }
  });
  if (!order || order.reservationState !== 'pending_approval') {
    throw new Error("طلب الحجز غير صالح.");
  }
  const internalLocation = await prisma.location.findFirst({
    where: {
      type: 'internal',
      companyId: session.companyId
    }
  });
  if (!internalLocation) {
    throw new Error("لم يتم العثور على مستودع داخلي.");
  }
  const {
    reserveStock
  } = await import('@/lib/utils/inventoryReservation');
  await prisma.$transaction(async tx => {
    for (const line of order.lines) {
      if (!line.productId) continue;
      const qty = Number(line.quantity);
      if (qty > 0) {
        await reserveStock(tx, session.companyId as string, line.productId, internalLocation.id, new Decimal(qty));
      }
    }
    await tx.saleOrder.update({
      where: {
        id: orderId
      },
      data: {
        reservationState: 'reserved'
      }
    });
    await tx.approvalRequest.updateMany({
      where: {
        resourceId: orderId,
        type: 'reservation_request',
        status: 'pending'
      },
      data: {
        status: 'approved',
        approverId: session.userId
      }
    });
  });
  revalidatePath(`/[locale]/sales/${orderId}`);
  return {
    success: true
  };
}
export async function checkAndReleaseExpiredReservations() {
  const session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("sale_order", "read");

  const now = new Date();
  const expiredOrders = await prisma.saleOrder.findMany({
    where: {
      reservationState: 'reserved',
      reservationExpiresAt: {
        lt: now
      }
    },
    include: {
      lines: true
    }
  });
  if (expiredOrders.length === 0) return {
    success: true,
    count: 0
  };
  const internalLocations = await prisma.location.findMany({
    where: {
      type: 'internal'
    }
  });
  const {
    releaseReservedStock
  } = await import('@/lib/utils/inventoryReservation');
  for (const order of expiredOrders) {
    const loc = internalLocations.find(l => l.companyId === order.companyId);
    if (!loc) continue;
    await prisma.$transaction(async tx => {
      for (const line of order.lines) {
        if (!line.productId) continue;
        const qty = Number(line.quantity);
        if (qty > 0) {
          await releaseReservedStock(tx, order.companyId as string, line.productId, loc.id, new Decimal(qty));
        }
      }
      await tx.saleOrder.update({
        where: {
          id: order.id
        },
        data: {
          reservationState: 'expired'
        }
      });
    });
  }
  return {
    success: true,
    count: expiredOrders.length
  };
}