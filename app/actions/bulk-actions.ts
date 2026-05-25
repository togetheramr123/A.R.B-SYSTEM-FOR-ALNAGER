"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ensureAccess } from "@/lib/access";

// Dependency checking function
async function checkDependencies(modelName: string, id: string): Promise<{ hasDeps: boolean; reason?: string }> {
  const normalizedModel = modelName.toLowerCase();

  if (normalizedModel === "partner") {
    const partner = await prisma.partner.findUnique({
      where: { id },
      select: {
        name: true,
        _count: {
          select: {
            saleOrders: true,
            purchaseOrders: true,
            invoices: true,
            payments: true,
          }
        }
      }
    });
    if (!partner) return { hasDeps: false };
    const counts = partner._count;
    if (counts.saleOrders > 0 || counts.purchaseOrders > 0 || counts.invoices > 0 || counts.payments > 0) {
      const details = [];
      if (counts.saleOrders > 0) details.push(`أوامر بيع (${counts.saleOrders})`);
      if (counts.purchaseOrders > 0) details.push(`أوامر شراء (${counts.purchaseOrders})`);
      if (counts.invoices > 0) details.push(`فواتير (${counts.invoices})`);
      if (counts.payments > 0) details.push(`مدفوعات (${counts.payments})`);
      return {
        hasDeps: true,
        reason: `جهة الاتصال "${partner.name}" مرتبطة بـ: ${details.join("، ")}`
      };
    }
  }

  if (normalizedModel === "product") {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        _count: {
          select: {
            saleLines: true,
            purchaseLines: true,
            invoiceLines: true,
            stockMoves: true,
            stockQuants: true,
            journalItems: true,
          }
        }
      }
    });
    if (!product) return { hasDeps: false };
    const counts = product._count;
    if (counts.saleLines > 0 || counts.purchaseLines > 0 || counts.invoiceLines > 0 || counts.stockMoves > 0 || counts.stockQuants > 0 || counts.journalItems > 0) {
      const details = [];
      if (counts.saleLines > 0) details.push(`بنود مبيعات (${counts.saleLines})`);
      if (counts.purchaseLines > 0) details.push(`بنود مشتريات (${counts.purchaseLines})`);
      if (counts.invoiceLines > 0) details.push(`بنود فواتير (${counts.invoiceLines})`);
      if (counts.stockMoves > 0) details.push(`حركات مخزنية (${counts.stockMoves})`);
      if (counts.stockQuants > 0) details.push(`كميات مخزنية (${counts.stockQuants})`);
      if (counts.journalItems > 0) details.push(`قيود محاسبية (${counts.journalItems})`);
      return {
        hasDeps: true,
        reason: `المنتج "${product.name}" مرتبط بـ: ${details.join("، ")}`
      };
    }
  }

  if (normalizedModel === "saleorder" || normalizedModel === "sale_order") {
    const order = await prisma.saleOrder.findUnique({
      where: { id },
      select: {
        name: true,
        status: true,
        _count: {
          select: {
            invoices: true,
            pickings: true,
          }
        }
      }
    });
    if (!order) return { hasDeps: false };
    if (order.status === "sale" || order.status === "done" || order._count.invoices > 0 || order._count.pickings > 0) {
      const details = [];
      if (order.status === "sale" || order.status === "done") details.push(`حالة الطلب (${order.status === "sale" ? "طلب مؤكد" : "طلب منتهي"})`);
      if (order._count.invoices > 0) details.push(`فواتير مرتبطة (${order._count.invoices})`);
      if (order._count.pickings > 0) details.push(`أذونات مخزن (${order._count.pickings})`);
      return {
        hasDeps: true,
        reason: `أمر البيع "${order.name}" مرتبط بـ: ${details.join("، ")}`
      };
    }
  }

  if (normalizedModel === "purchaseorder" || normalizedModel === "purchase_order") {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      select: {
        name: true,
        status: true,
        _count: {
          select: {
            invoices: true,
            pickings: true,
          }
        }
      }
    });
    if (!order) return { hasDeps: false };
    if (order.status === "purchase" || order.status === "done" || order._count.invoices > 0 || order._count.pickings > 0) {
      const details = [];
      if (order.status === "purchase" || order.status === "done") details.push(`حالة الطلب (${order.status === "purchase" ? "طلب شراء مؤكد" : "طلب منتهي"})`);
      if (order._count.invoices > 0) details.push(`فواتير مرتبطة (${order._count.invoices})`);
      if (order._count.pickings > 0) details.push(`أذونات مخزن (${order._count.pickings})`);
      return {
        hasDeps: true,
        reason: `أمر الشراء "${order.name}" مرتبط بـ: ${details.join("، ")}`
      };
    }
  }

  if (normalizedModel === "invoice") {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: {
        name: true,
        state: true,
      }
    });
    if (!invoice) return { hasDeps: false };
    if (invoice.state === "posted" || invoice.state === "paid") {
      return {
        hasDeps: true,
        reason: `الفاتورة "${invoice.name}" مرحلة أو مدفوعة.`
      };
    }
  }

  return { hasDeps: false };
}

export async function bulkDeleteRecords(modelName: string, ids: string[]) {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  let accessModel = modelName.toLowerCase();
  if (accessModel === "saleorder") accessModel = "sale";
  if (accessModel === "purchaseorder") accessModel = "purchase";
  await ensureAccess(accessModel, "unlink");

  // 1. Dependency checks
  const conflicts: string[] = [];
  for (const id of ids) {
    const check = await checkDependencies(modelName, id);
    if (check.hasDeps && check.reason) {
      conflicts.push(check.reason);
    }
  }

  if (conflicts.length > 0) {
    return {
      error: `لا يمكن الحذف لارتباط بعض السجلات ببيانات أخرى:\n` + conflicts.join("\n")
    };
  }

  // 2. Perform deletions
  try {
    const normalizedModel = modelName.toLowerCase();
    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        if (normalizedModel === "partner") {
          await tx.resPartnerBank.deleteMany({ where: { partnerId: id } });
          await tx.purchaseAgreement.deleteMany({ where: { partnerId: id } }).catch(() => {});
          await tx.saleAgreement.deleteMany({ where: { partnerId: id } }).catch(() => {});
          await tx.partner.delete({ where: { id } });
        } else if (normalizedModel === "product") {
          await tx.productAttributeLine.deleteMany({ where: { productId: id } });
          await tx.productSupplierInfo.deleteMany({ where: { productId: id } });
          await tx.stockQuant.deleteMany({ where: { productId: id } });
          
          const boms = await tx.billOfMaterial.findMany({ where: { productId: id } });
          for (const bom of boms) {
            await tx.bOMLine.deleteMany({ where: { bomId: bom.id } });
          }
          await tx.billOfMaterial.deleteMany({ where: { productId: id } });
          await tx.bOMLine.deleteMany({ where: { componentId: id } });
          await tx.product.deleteMany({ where: { templateId: id } });
          await tx.message.deleteMany({ where: { productId: id } });
          await tx.attachment.deleteMany({ where: { productId: id } });
          await tx.stockPutawayRule.deleteMany({ where: { productId: id } });
          await tx.stockReplenishment.deleteMany({ where: { productId: id } });
          await tx.productTax.deleteMany({ where: { productId: id } });
          await tx.priceListItem.deleteMany({ where: { productId: id } });
          await tx.saleOrderOption.deleteMany({ where: { productId: id } });
          await tx.stockScrap.deleteMany({ where: { productId: id } });
          await tx.stockLot.deleteMany({ where: { productId: id } });
          await tx.stockValuationLayer.deleteMany({ where: { productId: id } });
          await tx.product.delete({ where: { id } });
        } else if (normalizedModel === "saleorder" || normalizedModel === "sale_order") {
          await tx.saleOrderLine.deleteMany({ where: { orderId: id } });
          await tx.saleOrderOption.deleteMany({ where: { orderId: id } });
          await tx.message.deleteMany({ where: { saleOrderId: id } });
          await tx.attachment.deleteMany({ where: { saleOrderId: id } });
          await tx.saleOrder.delete({ where: { id } });
        } else if (normalizedModel === "purchaseorder" || normalizedModel === "purchase_order") {
          await tx.purchaseOrderLine.deleteMany({ where: { orderId: id } });
          await tx.message.deleteMany({ where: { purchaseOrderId: id } });
          await tx.attachment.deleteMany({ where: { purchaseOrderId: id } });
          await tx.purchaseOrder.delete({ where: { id } });
        } else if (normalizedModel === "invoice") {
          await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
          await tx.message.deleteMany({ where: { invoiceId: id } });
          await tx.attachment.deleteMany({ where: { invoiceId: id } });
          await tx.invoice.delete({ where: { id } });
        } else {
          const m = (tx as any)[modelName];
          if (m) {
            await m.delete({ where: { id } });
          } else {
            throw new Error(`Model ${modelName} not supported for delete`);
          }
        }
      }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return { error: "حدث خطأ أثناء محاولة الحذف: " + (error.message || "خطأ غير معروف") };
  }
}

export async function bulkArchiveRecords(modelName: string, ids: string[], active: boolean) {
  const session = await getSession();
  if (!session) return { error: "غير مصرح" };

  let accessModel = modelName.toLowerCase();
  if (accessModel === "saleorder") accessModel = "sale";
  if (accessModel === "purchaseorder") accessModel = "purchase";
  await ensureAccess(accessModel, "write");

  // 1. If we are archiving (active === false), check dependencies
  if (!active) {
    const conflicts: string[] = [];
    for (const id of ids) {
      const check = await checkDependencies(modelName, id);
      if (check.hasDeps && check.reason) {
        conflicts.push(check.reason);
      }
    }

    if (conflicts.length > 0) {
      return {
        error: `لا يمكن الأرشفة لأن بعض السجلات تحتوي على بيانات نشطة مرتبطة بها:\n` + conflicts.join("\n")
      };
    }
  }

  // 2. Perform archiving
  try {
    await prisma.$transaction(async (tx) => {
      const m = (tx as any)[modelName];
      if (m) {
        await m.updateMany({
          where: { id: { in: ids } },
          data: { active }
        });
      } else {
        throw new Error(`Model ${modelName} does not support archiving`);
      }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk Archive Error:", error);
    return { error: "حدث خطأ أثناء محاولة الأرشفة: " + (error.message || "خطأ غير معروف") };
  }
}
