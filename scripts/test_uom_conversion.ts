import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function testMath() {
    try {
        console.log("Fetching test product...");
        const product = await prisma.product.findFirst({
            where: { name: "Test Product UOM" }
        });
        if (!product) {
            console.log("Setup: Product not found, create it manually via UI first or ensure browser agent created it.");
            return;
        }

        console.log("Product:", product.name);
        console.log("Primary UOM:", product.uom);
        console.log("Secondary UOM:", product.secondaryUom);
        console.log("Secondary Factor:", product.secondaryUomFactor.toString());

        const line = {
            unitName: product.secondaryUom,
            quantity: 1
        };

        console.log(`\nSimulating Sales/Purchases for 1 ${line.unitName}...`);

        const isSecondary = line.unitName === product.secondaryUom && product.hasSecondaryUnit;
        const uomFactor = isSecondary ? new Decimal(product.secondaryUomFactor || 1) : new Decimal(1);

        const baseQuantity = new Decimal(line.quantity).mul(uomFactor);

        console.log(`Is Secondary Selected? ${isSecondary}`);
        console.log(`UOM Factor Applied: ${uomFactor.toString()}`);
        console.log(`Final Base Quantity to deduct/add: ${baseQuantity.toString()} ${product.uom}`);

        if (baseQuantity.toString() === "30") {
            console.log("SUCCESS: Math logic calculates 30 pieces correctly for 1 carton.");
        } else {
            console.log("FAIL: Math logic is incorrect.");
        }

    } catch (err) {
        console.error("Test failed", err);
    } finally {
        await prisma.$disconnect();
    }
}

testMath();
