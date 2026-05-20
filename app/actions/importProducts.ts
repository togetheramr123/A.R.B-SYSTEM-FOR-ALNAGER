'use server';

import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { validateInventoryAdjustment } from './inventory-adjustments';

export type ImportedProductRow = {
  name: string;
  qtyOnHand: number;
  secondaryRatio: number;
  cost: number;
  uom: string;
  secondaryUom: string;
  category: string;
};

export async function importProductsData(rows: ImportedProductRow[]) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("product", "create");

  const companyId = session.companyId;
  const userId = session.userId;

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Prepare default accounts for Categories
      const accounts = await tx.account.findMany({
        where: { companyId, code: { in: ['500001', '400002', '103029', '103039', '103049'] } }
      });
      const getAcct = (code: string) => accounts.find(a => a.code === code)?.id;
      const defaultIncomeId = getAcct('500001');
      const defaultExpenseId = getAcct('400002');
      const defaultStockValuationId = getAcct('103029');
      const defaultStockInputId = getAcct('103039');
      const defaultStockOutputId = getAcct('103049');

      const stockJournal = await tx.journal.findFirst({
        where: { companyId, name: { contains: 'المخزون' } }
      });
      const defaultStockJournalId = stockJournal?.id;

      // 2. Prepare UOM Category
      let uomCat = await tx.uomCategory.findFirst({ where: { name: 'الوحدة' } });
      if (!uomCat) {
        uomCat = await tx.uomCategory.create({ data: { name: 'الوحدة' } });
      }

      // 3. Prepare Main Warehouse Location
      let mainLocation = await tx.location.findFirst({
        where: { 
          type: 'internal', 
          OR: [{ companyId }, { companyId: null }],
          name: { not: { endsWith: 'Input' } } 
        },
        orderBy: { id: 'asc' }
      });
      if (!mainLocation) throw new Error("لم يتم العثور على المخزن الرئيسي");

      // Group rows by category
      const categoriesSet = new Set(rows.map(r => r.category).filter(Boolean));
      const categoryMap = new Map<string, string>();

      // Create missing categories
      for (const catName of categoriesSet) {
        let cat = await tx.productCategory.findFirst({ where: { name: catName, companyId } });
        if (!cat) {
          cat = await tx.productCategory.create({
            data: {
              name: catName,
              companyId,
              costingMethod: 'avco',
              valuation: 'real_time',
              propertyAccountIncomeId: defaultIncomeId,
              propertyAccountExpenseId: defaultExpenseId,
              propertyStockAccountId: defaultStockValuationId,
              propertyStockAccountInputId: defaultStockInputId,
              propertyStockAccountOutputId: defaultStockOutputId,
              propertyStockJournalId: defaultStockJournalId
            }
          });
        }
        categoryMap.set(catName, cat.id);
      }

      // 4. Create missing UOMs
      const uomMap = new Map<string, string>();
      const ensureUom = async (uomName: string, type: string, ratio: number) => {
        if (!uomName) return null;
        let uom = await tx.uom.findFirst({ where: { name: uomName, categoryId: uomCat!.id } });
        if (!uom) {
          uom = await tx.uom.create({
            data: { name: uomName, categoryId: uomCat!.id, type, ratio }
          });
        } else if (uom.ratio !== ratio) {
          uom = await tx.uom.update({
            where: { id: uom.id },
            data: { ratio }
          });
        }
        uomMap.set(uomName, uom.id);
        return uom.name; // Use name directly on product
      };

      // Ensure reference UOMs like "قطعة" exist
      const refUoms = new Set(rows.map(r => r.uom).filter(Boolean));
      for (const ruom of refUoms) {
        await ensureUom(ruom, 'reference', 1.0);
      }

      const importedProducts = [];

      for (const row of rows) {
        // Ensure secondary UOM
        let secUomName = null;
        let calculatedRatio = row.secondaryRatio > 0 ? row.secondaryRatio : 1.0;
        
        if (row.secondaryUom) {
           const match = row.secondaryUom.match(/\d+/);
           if (match) {
             calculatedRatio = parseInt(match[0], 10);
           }
           
           await ensureUom(row.secondaryUom, 'bigger', calculatedRatio);
           secUomName = row.secondaryUom;
        }

        const catId = row.category ? categoryMap.get(row.category) : null;

        // Find or create product
        let product = await tx.product.findFirst({
          where: { name: row.name, companyId }
        });

        if (product) {
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              costPrice: row.cost > 0 ? row.cost : product.costPrice,
              categoryId: catId || product.categoryId,
              uom: row.uom || product.uom,
              hasSecondaryUnit: !!secUomName || product.hasSecondaryUnit,
              secondaryUom: secUomName || product.secondaryUom,
              secondaryUomFactor: calculatedRatio > 1 ? calculatedRatio : product.secondaryUomFactor,
              detailedType: 'product',
              type: 'storable'
            }
          });
        } else {
          product = await tx.product.create({
            data: {
              name: row.name,
              companyId,
              costPrice: row.cost || 0,
              categoryId: catId,
              uom: row.uom || 'قطعة',
              purchaseUom: row.uom || 'قطعة',
              hasSecondaryUnit: !!secUomName,
              secondaryUom: secUomName,
              secondaryUomFactor: calculatedRatio,
              detailedType: 'product',
              type: 'storable',
              invoicingPolicy: 'delivered',
              propertyAccountExpenseId: defaultExpenseId,
              propertyAccountIncomeId: defaultIncomeId,
            }
          });
        }
        
        importedProducts.push({ product, qtyOnHand: row.qtyOnHand });
      }

      // 5. Create Inventory Adjustment for Initial Stock
      const productsWithQty = importedProducts.filter(p => p.qtyOnHand > 0);
      let recordId = null;

      if (productsWithQty.length > 0) {
        // Find existing draft record or create new
        const count = await tx.inventoryAdjustmentRecord.count({
          where: { companyId, date: { gte: new Date(new Date().getFullYear(), 0, 1) } }
        });
        
        const record = await tx.inventoryAdjustmentRecord.create({
          data: {
            name: `INV/${new Date().getFullYear()}/${String(count + 1).padStart(3, '0')} - أرصدة افتتاحية`,
            warehouseId: mainLocation.warehouseId,
            userId,
            companyId,
            status: 'draft',
            notes: 'رصيد افتتاحي مستورد من الإكسيل'
          }
        });
        recordId = record.id;

        for (const item of productsWithQty) {
          // Check existing quant
          const existingQuant = await tx.stockQuant.findFirst({
            where: { productId: item.product.id, locationId: mainLocation.id }
          });
          const bookQty = existingQuant ? Number(existingQuant.quantity) : 0;

          await tx.inventoryAdjustmentLine.create({
            data: {
              recordId: record.id,
              productId: item.product.id,
              locationId: mainLocation.id,
              bookQty: bookQty,
              actualQty: item.qtyOnHand,
              diffQty: item.qtyOnHand - bookQty,
              uom: item.product.uom
            }
          });
        }
      }

      return { success: true, count: rows.length, recordId };
    }, {
      maxWait: 20000, // 20 seconds max wait
      timeout: 120000 // 2 minutes timeout for large imports
    });

    if (txResult.recordId) {
      await validateInventoryAdjustment(txResult.recordId);
    }

    revalidatePath('/[locale]/inventory/products');
    revalidatePath('/ar/inventory/products');
    revalidatePath('/en/inventory/products');

    return { success: true, count: txResult.count };
  } catch (e: any) {
    console.error("Import Error:", e);
    return { success: false, error: e.message };
  }
}
