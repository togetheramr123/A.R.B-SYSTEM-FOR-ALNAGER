import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Deep Alignment Implementation...');

    const products = [
        { sku: 'Odoo_AF_50_NAJJ', invoicingPolicy: 'delivered', controlPolicy: 'delivered', taxes: 0.0 },
        { sku: 'Odoo_AF_114_NAJJ', invoicingPolicy: 'delivered', controlPolicy: 'delivered', taxes: 0.0, costPrice: 8.37 }
    ];

    for (const p of products) {
        const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
        if (existing) {
            await prisma.product.update({
                where: { id: existing.id },
                data: {
                    invoicingPolicy: p.invoicingPolicy,
                    controlPolicy: p.controlPolicy,
                    taxes: p.taxes,
                    costPrice: p.costPrice ?? existing.costPrice
                }
            });
            console.log(`✅ Deep alignment applied to: ${existing.name} (${p.sku})`);
        }
    }

    // Verify "فرع 1" context (Ensure we are in the right company/branch context if modeled)
    // For now, we remain at company level as per current schema.

    console.log(`✅ Deep alignment implementation finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
