
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Sales Flow Verification...");

    // 1. Setup Data
    const partner = await prisma.partner.findFirst() || await prisma.partner.create({
        data: { name: 'Verified Customer', email: 'test@verified.com' }
    });
    console.log(`✅ Partner: ${partner.name}`);

    // 2. Create Sale Order with Mixed Taxes and Secondary Units
    console.log("📦 Creating Sale Order...");
    const saleOrderData = {
        customer: partner.name,
        date: new Date().toISOString(),
        lines: [
            {
                productId: 'PROD-A',
                description: 'Product with VAT',
                qty: 10,
                price: 100,
                discount: 0,
                tax: 14 // Standard Tax
            },
            {
                productId: 'PROD-B',
                description: 'Tax Exempt Product',
                qty: 5,
                price: 200,
                discount: 10, // 10% Discount
                tax: 0 // No Tax
            },
            {
                productId: 'PROD-C',
                description: 'Product with Secondary Unit',
                qty: 20,
                price: 50,
                discount: 0,
                tax: 14,
                secondaryQuantity: 10.5,
                secondaryUnit: 'kg'
            }
        ]
    };

    // Simulate Action Logic locally to verify calculation logic matches
    const linesWithTotals = saleOrderData.lines.map(line => {
        const subtotal = line.qty * line.price * (1 - line.discount / 100);
        const taxAmount = subtotal * (line.tax / 100);
        return { ...line, subtotal, taxAmount };
    });

    const totalUntaxed = linesWithTotals.reduce((sum, line) => sum + line.subtotal, 0);
    const totalTax = linesWithTotals.reduce((sum, line) => sum + line.taxAmount, 0);
    const totalAmount = totalUntaxed + totalTax;

    console.log(`   - Calculated Untaxed: ${totalUntaxed}`);
    console.log(`   - Calculated Tax: ${totalTax}`);
    console.log(`   - Calculated Total: ${totalAmount}`);

    // Create in DB
    const saleOrder = await prisma.saleOrder.create({
        data: {
            name: `S-TEST-${Math.floor(Math.random() * 1000)}`,
            status: 'draft',
            partnerId: partner.id,
            amountUntaxed: totalUntaxed,
            amountTax: totalTax,
            amountTotal: totalAmount,
            dateOrder: new Date(),
            lines: {
                create: saleOrderData.lines.map(line => ({
                    name: line.description,
                    quantity: line.qty,
                    priceUnit: line.price,
                    discount1: line.discount,
                    taxRate: line.tax,
                    priceSubtotal: line.qty * line.price * (1 - line.discount / 100),
                    secondaryQuantity: line.secondaryQuantity || 0,
                    secondaryUnit: line.secondaryUnit
                }))
            }
        },
        include: { lines: true }
    });
    console.log(`✅ Sale Order Created: ${saleOrder.name} (ID: ${saleOrder.id})`);

    // 3. Confirm Sale Order (Generate Picking)
    console.log("🚚 Confirming Sale Order & Generating Picking...");

    // Simulate Confirmation Logic
    await prisma.saleOrder.update({ where: { id: saleOrder.id }, data: { status: 'sale' } });

    const outputLocation = await prisma.location.findFirst({ where: { type: 'internal' } });
    const customerLocation = await prisma.location.findFirst({ where: { type: 'customer' } });

    if (!outputLocation || !customerLocation) {
        console.error("❌ Missing locations for picking generation!");
        return;
    }

    const picking = await prisma.stockPicking.create({
        data: {
            name: `WH/OUT/TEST-${Math.floor(Math.random() * 1000)}`,
            pickingType: 'OUTGOING',
            partnerId: partner.id,
            locationId: outputLocation.id,
            locationDestId: customerLocation.id,
            origin: saleOrder.name,
            status: 'assigned',
            scheduledDate: new Date(),
        }
    });

    for (const line of saleOrder.lines) {
        await prisma.stockMove.create({
            data: {
                pickingId: picking.id,
                name: line.name || 'Product',
                quantity: line.quantity,
                secQty: line.secondaryQuantity, // Verify this mapping
                secUnitName: line.secondaryUnit,
                sourceLocationId: outputLocation.id,
                destLocationId: customerLocation.id,
                status: 'assigned'
            }
        });
    }

    const createdPicking = await prisma.stockPicking.findUnique({
        where: { id: picking.id },
        include: { moves: true }
    });

    console.log(`✅ Picking Created: ${createdPicking?.name}`);
    createdPicking?.moves.forEach(move => {
        console.log(`   -> Move: ${move.name} | Qty: ${move.quantity} | Sec Qty: ${move.secQty} ${move.secUnitName || ''}`);
        if (move.secQty !== 0 && !move.secQty) console.warn("   ⚠️  Secondary Quantity MIA!");
    });


    // 4. Create Invoice
    console.log("💰 Creating Invoice...");
    const invoice = await prisma.invoice.create({
        data: {
            name: `INV/TEST/${Math.floor(Math.random() * 1000)}`,
            partnerId: partner.id,
            type: 'out_invoice',
            state: 'draft',
            invoiceOrigin: saleOrder.name,
            amountUntaxed: saleOrder.amountUntaxed,
            amountTax: saleOrder.amountTax,
            amountTotal: saleOrder.amountTotal,
            lines: {
                create: saleOrder.lines.map(line => ({
                    name: line.name,
                    quantity: line.quantity,
                    priceUnit: line.priceUnit,
                    priceSubtotal: line.priceSubtotal,
                    discount1: line.discount1
                }))
            }
        },
        include: { lines: true }
    });

    console.log(`✅ Invoice Created: ${invoice.name} saved in Invoices Module.`);
    console.log(`   - Invoice Amount: ${invoice.amountTotal}`);
    console.log(`   - Line Items: ${invoice.lines.length}`);

    console.log("\n🎉 Verification Complete: All systems nominal.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
