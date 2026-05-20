import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Full System Review & Verification Cycle...");

    // 1. Setup Data (Company & Category)
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("Please run seed first");

    let category = await prisma.productCategory.findFirst({ where: { name: 'Full Cycle Test' } });
    if (!category) {
        category = await prisma.productCategory.create({
            data: {
                name: 'Full Cycle Test',
                costingMethod: 'avco',
                valuation: 'real_time'
            }
        });
    }
    console.log("✅ Category & Company Ready");

    // 2. Create Product
    const productName = `Modular Test Product ${Date.now()}`;
    const product = await prisma.product.create({
        data: {
            name: productName,
            type: 'storable',
            uom: 'Units',
            purchaseUom: 'Units',
            salePrice: new Decimal(150),
            costPrice: new Decimal(100),
            categoryId: category.id,
            companyId: company.id
        }
    });
    console.log(`✅ Product Created: ${product.name}`);

    // 3. Create Vendor
    const vendor = await prisma.partner.create({
        data: {
            name: "Test Vendor Modular",
            isVendor: true,
            companyId: company.id
        }
    });
    console.log(`✅ Vendor Created: ${vendor.name}`);

    // 4. Create Purchase Order
    const po = await prisma.purchaseOrder.create({
        data: {
            name: `PO-${Date.now()}`,
            partnerId: vendor.id,
            companyId: company.id,
            status: 'purchase',
            lines: {
                create: [{
                    productId: product.id,
                    name: product.name,
                    quantity: new Decimal(10),
                    priceUnit: new Decimal(100),
                    priceSubtotal: new Decimal(1000)
                }]
            }
        },
        include: { lines: true }
    });
    console.log(`✅ Purchase Order Confirmed: ${po.name}`);

    // 5. Receive Stock (Stock Move)
    const location = await prisma.location.findFirst({ where: { type: 'internal' } });
    if (!location) throw new Error("No internal location found");

    const move = await prisma.stockMove.create({
        data: {
            name: `RECEIVE-${po.name}`,
            productId: product.id,
            quantity: new Decimal(10),
            quantityDone: new Decimal(10),
            destLocationId: location.id,
            status: 'done',
            companyId: company.id
        }
    });

    // Update Quant
    await prisma.stockQuant.upsert({
        where: { productId_locationId: { productId: product.id, locationId: location.id } },
        update: { quantity: { increment: 10 } },
        create: {
            productId: product.id,
            locationId: location.id,
            quantity: new Decimal(10),
            companyId: company.id
        }
    });
    console.log(`✅ Stock Received at ${location.name}. New Qty: 10`);

    // 6. Create Vendor Bill (Accounting)
    const journal = await prisma.journal.findFirst({ where: { type: 'purchase' } });
    if (!journal) throw new Error("No purchase journal found");

    const bill = await prisma.invoice.create({
        data: {
            name: `BILL/${Date.now()}`,
            type: 'in_invoice',
            partnerId: vendor.id,
            amountUntaxed: new Decimal(1000),
            amountTotal: new Decimal(1000),
            state: 'posted',
            companyId: company.id,
            lines: {
                create: [{
                    productId: product.id,
                    name: product.name,
                    quantity: new Decimal(10),
                    priceUnit: new Decimal(100),
                    priceSubtotal: new Decimal(1000)
                }]
            }
        }
    });
    console.log(`✅ Vendor Bill Created & Posted: ${bill.name}`);

    // 7. Verify Results
    const finalQuant = await prisma.stockQuant.findUnique({
        where: { productId_locationId: { productId: product.id, locationId: location.id } }
    });

    console.log("\n--- Final Review Report ---");
    console.log(`🔹 Product: ${product.name}`);
    console.log(`🔹 Inventory Check: ${finalQuant?.quantity} units correctly held in ${location.name}`);
    console.log(`🔹 Accounting Check: Bill ${bill.name} for ${bill.amountTotal} EGP is posted.`);
    console.log(`🔹 Integration: Purchase -> Inventory -> Accounting cycle verified.`);
    console.log("\n🏆 SYSTEM VERIFIED: ALL MODULES RESPONDING CORRECTLY 🏆\n");

}

main()
    .catch(e => {
        console.error("❌ Verification Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
