
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Product Account Linking...");

    // 1. Get an Account (Income)
    const incomeAccount = await prisma.account.findFirst({
        where: { type: 'income' }
    });

    if (!incomeAccount) {
        console.error("No income account found! Run seed or ensure accounts exist.");
        process.exit(1);
    }
    console.log(`Found Income Account: ${incomeAccount.name} (${incomeAccount.id})`);

    // 2. Create Product with Link
    const productName = `Test Product Link ${Math.floor(Math.random() * 1000)}`;
    const product = await prisma.product.create({
        data: {
            name: productName,
            propertyAccountIncomeId: incomeAccount.id,
            // Minimal required fields
            canBeSold: true,
            canBePurchased: true,
            salePrice: 100,
            costPrice: 50,
        }
    });

    console.log(`Created Product: ${product.name} (${product.id})`);

    // 3. Verify Link
    const fetchedProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { propertyAccountIncome: true }
    });

    if (fetchedProduct?.propertyAccountIncomeId === incomeAccount.id) {
        console.log("SUCCESS: Product linked to Income Account correctly.");
        console.log(`Linked Account Name: ${fetchedProduct.propertyAccountIncome?.name}`);
    } else {
        console.error("FAILURE: Product NOT linked correctly.");
        console.log(`Expected: ${incomeAccount.id}, Got: ${fetchedProduct?.propertyAccountIncomeId}`);
    }

    // Cleanup
    await prisma.product.delete({ where: { id: product.id } });
    console.log("Cleanup done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
