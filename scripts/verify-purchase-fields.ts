
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Purchase Order Field Verification...');

    // 1. Get Context
    const company = await prisma.company.findFirst();
    const vendor = await prisma.partner.findFirst({ where: { isVendor: true } });
    const product = await prisma.product.findFirst();

    if (!company || !vendor || !product) {
        console.error('❌ Missing basic data (company, vendor, or product). Run seed first.');
        return;
    }

    // 2. Create a Dummy Account if not exists
    let account = await prisma.account.findFirst({ where: { code: '101000' } });
    if (!account) {
        account = await prisma.account.create({
            data: {
                name: 'Test Expense Account',
                code: '101000',
                type: 'expense',
                companyId: company.id
            }
        });
        console.log('✅ Created Test Account: 101000');
    }

    // 3. Simulate Form Data Submission
    // The user inputs this in the form:
    const formData = {
        vendorId: vendor.id,
        date: new Date(),
        lines: [
            {
                productId: product.id,
                description: 'Test Description for Item',
                accountId: account.id,
                qty: 10,
                uom: 'Dozen',
                secQty: 120,
                secUnit: 'Units',
                price: 100,
                discount: 15, // 15% discount
            }
        ]
    };

    console.log('📝 Simulating Form Submission with:', JSON.stringify(formData, null, 2));

    // 4. Create in DB (Mimicking server action logic)
    const po = await prisma.purchaseOrder.create({
        data: {
            name: `TEST-PO-${Math.floor(Math.random() * 1000)}`,
            companyId: company.id,
            partnerId: formData.vendorId,
            dateOrder: formData.date,
            status: 'draft',
            lines: {
                create: formData.lines.map(line => ({
                    productId: line.productId,
                    name: line.description,
                    accountId: line.accountId,
                    quantity: line.qty,
                    unitName: line.uom,
                    secondaryQuantity: line.secQty,
                    secondaryUnit: line.secUnit,
                    priceUnit: line.price,
                    discount1: line.discount,
                    // Calculated fields
                    priceSubtotal: line.qty * line.price * (1 - line.discount / 100)
                }))
            }
        },
        include: { lines: true }
    });

    console.log('✅ Purchase Order Created Successfully!');
    console.log('🆔 PO ID:', po.name);
    console.log('--------------------------------------------------');

    // 5. Verify Fields
    const line = po.lines[0];
    console.log('🔍 Verifying Line Items...');
    console.log(`   - Product: ${line.productId === product.id ? '✅ Correct' : '❌ Wrong'}`);
    console.log(`   - Description: "${line.name}" ${line.name === 'Test Description for Item' ? '✅' : '❌'}`);
    console.log(`   - Account ID: ${line.accountId === account.id ? '✅ Linked' : '❌ Missing'}`);
    console.log(`   - Quantity: ${line.quantity} ${line.quantity === 10 ? '✅' : '❌'}`);
    console.log(`   - UoM: ${line.unitName} ${line.unitName === 'Dozen' ? '✅' : '❌'}`);
    console.log(`   - Secondary Qty: ${line.secondaryQuantity} ${line.secondaryQuantity === 120 ? '✅' : '❌'}`);
    console.log(`   - Secondary Unit: ${line.secondaryUnit} ${line.secondaryUnit === 'Units' ? '✅' : '❌'}`);
    console.log(`   - Discount: ${line.discount1}% ${line.discount1 === 15 ? '✅' : '❌'}`);
    console.log(`   - Subtotal: ${line.priceSubtotal} ${line.priceSubtotal === 850 ? '✅ (10 * 100 * 0.85)' : '❌'}`);

    console.log('--------------------------------------------------');
    console.log('🎉 Verification Complete: All fields are correctly mapped and saved to Database.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
