import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestProduct() {
    try {
        console.log("Looking for UOMs...");
        let pieceUom = await prisma.uom.findFirst({ where: { name: { contains: "قطعة" } } })
            || await prisma.uom.findFirst({ where: { name: { contains: "Unit" } } });
        let cartonUom = await prisma.uom.findFirst({ where: { name: { contains: "كرتونة" } } })
            || await prisma.uom.findFirst({ where: { name: { contains: "Carton" } } });

        console.log("Pieces UOM:", pieceUom?.name);
        console.log("Carton UOM:", cartonUom?.name);

        const productName = "Test Product UOM";
        let product = await prisma.product.findFirst({ where: { name: productName } });

        if (product) {
            console.log("Updating existing test product...");
            product = await prisma.product.update({
                where: { id: product.id },
                data: {
                    uom: pieceUom?.name || "قطعة",
                    purchaseUom: pieceUom?.name || "قطعة",
                    hasSecondaryUnit: true,
                    secondaryUom: cartonUom?.name || "كرتونة",
                    secondaryUomFactor: 30
                }
            });
        } else {
            console.log("Creating new test product...");
            // Need a category to create product
            let cat = await prisma.productCategory.findFirst();
            if (!cat) {
                cat = await prisma.productCategory.create({ data: { name: "All Categories" } });
            }

            product = await prisma.product.create({
                data: {
                    name: productName,
                    type: "storable",
                    uom: pieceUom?.name || "قطعة",
                    purchaseUom: pieceUom?.name || "قطعة",
                    hasSecondaryUnit: true,
                    secondaryUom: cartonUom?.name || "كرتونة",
                    secondaryUomFactor: 30,
                    categoryId: cat.id
                }
            });
        }

        console.log("Product ready:", product.name, "Base:", product.uom, "Sec:", product.secondaryUom, "Factor:", product.secondaryUomFactor);

        // Ensure we have a vendor
        let vendor = await prisma.partner.findFirst({ where: { type: 'company' } });
        if (!vendor) {
            vendor = await prisma.partner.create({ data: { name: "Test Vendor", type: "company" } });
        }
        console.log("Vendor ready:", vendor.name);

    } catch (err) {
        console.error("Test setup failed", err);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestProduct();
