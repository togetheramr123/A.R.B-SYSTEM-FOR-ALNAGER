'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * تصفير بيانات المنتجات والمخزون والفئات من قاعدة البيانات
 * يحتفظ بالحسابات والشركاء والمستخدمين والقيود المحاسبية
 * 
 * الترتيب مهم جداً بسبب العلاقات بين الجداول (Foreign Keys)
 */
export async function resetProductData(confirmCode: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('غير مصرح');
  }
  if (session.role !== 'OWNER') {
    throw new Error('هذا الإجراء متاح فقط لمالك النظام');
  }

  if (confirmCode !== 'RESET-PRODUCTS-CONFIRM') {
    return { success: false, error: 'رمز التأكيد غير صحيح' };
  }

  try {
    // === المرحلة 1: فك ارتباط المنتجات من الجداول المرتبطة ===
    
    // فك ارتباط المنتجات من سطور الفواتير
    await prisma.invoiceLine.updateMany({
      where: { productId: { not: null } },
      data: { productId: null }
    });

    // فك ارتباط المنتجات من عناصر القيود المحاسبية
    await prisma.journalItem.updateMany({
      where: { productId: { not: null } },
      data: { productId: null }
    });

    // === المرحلة 2: حذف جداول المخزون (الكميات) ===
    
    // حذف طبقات التقييم
    try { await prisma.stockValuationLayer.deleteMany({}); } catch(e) { console.log('stockValuationLayer skip'); }
    
    // حذف قواعد التخزين
    try { await prisma.stockPutawayRule.deleteMany({}); } catch(e) { console.log('stockPutawayRule skip'); }
    
    // حذف طلبات إعادة التزويد
    try { await prisma.stockReplenishment.deleteMany({}); } catch(e) { console.log('stockReplenishment skip'); }
    
    // حذف المرتجعات/التالف
    try { await prisma.stockScrap.deleteMany({}); } catch(e) { console.log('stockScrap skip'); }
    
    // حذف الأرصدة المخزنية (الكميات في اليد)
    await prisma.stockQuant.deleteMany({});
    
    // حذف أرقام اللوتات
    try { await prisma.stockLot.deleteMany({}); } catch(e) { console.log('stockLot skip'); }
    
    // حذف حركات المخزون
    await prisma.stockMove.deleteMany({});
    
    // حذف أوامر التسليم/الاستلام
    await prisma.stockPicking.deleteMany({});
    
    // حذف سطور تسوية المخزون
    try { await prisma.inventoryAdjustmentLine.deleteMany({}); } catch(e) { console.log('inventoryAdjustmentLine skip'); }
    
    // حذف تسويات المخزون
    try { await prisma.inventoryAdjustmentRecord.deleteMany({}); } catch(e) { console.log('inventoryAdjustmentRecord skip'); }

    // === المرحلة 3: حذف بيانات التسعير والموردين ===
    
    // حذف أسعار قوائم الأسعار
    await prisma.priceListItem.deleteMany({});
    
    // حذف معلومات الموردين
    await prisma.productSupplierInfo.deleteMany({});
    
    // حذف ضرائب المنتجات
    try { await prisma.productTax.deleteMany({}); } catch(e) { console.log('productTax skip'); }
    
    // حذف مفضلات البوابة
    try { await prisma.portalFavorite.deleteMany({}); } catch(e) { console.log('portalFavorite skip'); }

    // === المرحلة 4: حذف المرفقات والرسائل المرتبطة بالمنتجات ===
    
    await prisma.attachment.deleteMany({ where: { productId: { not: null } } });
    await prisma.message.deleteMany({ where: { productId: { not: null } } });

    // === المرحلة 5: حذف سطور أوامر البيع والشراء ===
    
    // فك ارتباط سطور أوامر البيع
    try {
      await prisma.saleOrderLine.updateMany({
        where: { productId: { not: null } },
        data: { productId: null }
      });
    } catch(e) { console.log('saleOrderLine unlink skip'); }

    // فك ارتباط سطور أوامر الشراء
    try {
      await prisma.purchaseOrderLine.updateMany({
        where: { productId: { not: null } },
        data: { productId: null }
      });
    } catch(e) { console.log('purchaseOrderLine unlink skip'); }

    // === المرحلة 6: حذف خطوط المنتجات (BOM, Attributes) ===
    
    try { await prisma.bOMLine.deleteMany({}); } catch(e) { console.log('bOMLine skip'); }
    try { await prisma.billOfMaterial.deleteMany({}); } catch(e) { console.log('billOfMaterial skip'); }
    
    // حذف خطوط سمات المنتجات
    try { await prisma.productAttributeLine.deleteMany({}); } catch(e) { console.log('productAttributeLine skip'); }
    
    // حذف خيارات أوامر البيع
    try { await prisma.saleOrderOption.deleteMany({}); } catch(e) { console.log('saleOrderOption skip'); }

    // === المرحلة 7: حذف المنتجات نفسها ===
    
    const deletedProducts = await prisma.product.deleteMany({});

    // === المرحلة 8: حذف فئات المنتجات ===
    
    // حذف الفئات الفرعية أولاً ثم الرئيسية
    // نحذفهم على مراحل بسبب العلاقة الذاتية (parent-child)
    for (let i = 0; i < 5; i++) {
      const remaining = await prisma.productCategory.count();
      if (remaining === 0) break;
      
      // حذف الفئات التي ليس لها أطفال
      const leafCategories = await prisma.productCategory.findMany({
        where: {
          children: { none: {} }
        },
        select: { id: true }
      });
      
      if (leafCategories.length > 0) {
        await prisma.productCategory.deleteMany({
          where: { id: { in: leafCategories.map(c => c.id) } }
        });
      }
    }
    
    const deletedCategories = await prisma.productCategory.count();

    // === المرحلة 9: حذف سمات المنتجات (اختياري) ===
    try { await prisma.attributeValue.deleteMany({}); } catch(e) { console.log('attributeValue skip'); }
    try { await prisma.productAttribute.deleteMany({}); } catch(e) { console.log('productAttribute skip'); }
    try { await prisma.productTag.deleteMany({}); } catch(e) { console.log('productTag skip'); }

    return {
      success: true,
      message: 'تم تصفير بيانات المنتجات والمخزون بنجاح!',
      deletedProducts: deletedProducts.count,
      remainingCategories: deletedCategories
    };

  } catch (error: any) {
    console.error('Reset error:', error);
    return {
      success: false,
      error: error.message || 'حدث خطأ أثناء التصفير'
    };
  }
}
