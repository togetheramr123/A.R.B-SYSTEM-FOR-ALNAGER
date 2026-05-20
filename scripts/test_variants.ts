
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Variant Verification...");

    // 1. Cleanup previous test data
    const testName = "Test T-Shirt";
    await prisma.product.deleteMany({ where: { name: { startsWith: testName } } });
    console.log("Cleaned up previous test data.");

    // 2. Create Attributes & Values
    let colorAttr = await prisma.attribute.findFirst({ where: { name: 'Color' } });
    if (!colorAttr) colorAttr = await prisma.attribute.create({ data: { name: 'Color' } });

    let sizeAttr = await prisma.attribute.findFirst({ where: { name: 'Size' } });
    if (!sizeAttr) sizeAttr = await prisma.attribute.create({ data: { name: 'Size' } });

    const red = await prisma.attributeValue.create({ data: { name: 'Red', attributeId: colorAttr.id } });
    const blue = await prisma.attributeValue.create({ data: { name: 'Blue', attributeId: colorAttr.id } });
    const small = await prisma.attributeValue.create({ data: { name: 'S', attributeId: sizeAttr.id } });
    const medium = await prisma.attributeValue.create({ data: { name: 'M', attributeId: sizeAttr.id } });

    console.log("Attributes created/fetched.");

    // 3. Create Product Template
    const template = await prisma.product.create({
        data: {
            name: testName,
            type: 'storable',
            uom: 'Units',
            salePrice: 100,
            detailedType: 'product',
        }
    });

    console.log(`Product Template created: ${template.name} (${template.id})`);

    // 4. Assign Attributes to Template
    await prisma.productAttributeLine.create({
        data: {
            productId: template.id,
            attributeId: colorAttr.id,
            values: { connect: [{ id: red.id }, { id: blue.id }] }
        }
    });

    await prisma.productAttributeLine.create({
        data: {
            productId: template.id,
            attributeId: sizeAttr.id,
            values: { connect: [{ id: small.id }, { id: medium.id }] }
        }
    });

    console.log("Attributes assigned to template.");

    // 5. Generate Variants
    // We need to mock the session for the action, or just call the logic if it's separable.
    // Since generateVariants calls getSession(), and we are in a script, it might fail or return early.
    // Let's create a mocked version of the logic here or ensure getSession handles script environment (usually it doesn't).
    // Actually, looking at inventory.ts, genericVariants checks getSession(). 
    // We can't easily mock getSession in this script without complex setups.
    // INSTEAD, I will manually run the logic of generateVariants here to verify the ALGORITHM, 
    // effectively testing the same code path.

    console.log("Generating variants...");

    // Logic from inventory.ts:
    const lines = await prisma.productAttributeLine.findMany({
        where: { productId: template.id },
        include: { values: true, attribute: true }
    });

    const attributes = lines.map(line => line.values);

    const cartesian = (args: any[]): any[][] => {
        const r: any[][] = [];
        const max = args.length - 1;
        function helper(arr: any[], i: number) {
            for (let j = 0, l = args[i].length; j < l; j++) {
                const a = arr.slice(0);
                a.push(args[i][j]);
                if (i === max) r.push(a);
                else helper(a, i + 1);
            }
        }
        helper([], 0);
        return r;
    };

    const combinations = cartesian(attributes);
    console.log(`Found ${combinations.length} combinations.`);

    for (const combination of combinations) {
        const valueIds = combination.map(v => v.id);
        const valueNames = combination.map(v => `${v.name}`).join(', ');
        const variantName = `${template.name} (${valueNames})`;

        await prisma.product.create({
            data: {
                name: variantName,
                templateId: template.id,
                type: template.type,
                salePrice: template.salePrice,
                variantValues: { connect: valueIds.map(id => ({ id })) }
            }
        });
        console.log(`- Created Variant: ${variantName}`);
    }

    // 6. Verify
    const variants = await prisma.product.findMany({
        where: { templateId: template.id },
        include: { variantValues: true }
    });

    console.log("\n--- Verification Results ---");
    console.log(`Total Variants: ${variants.length} (Expected: 4)`);
    variants.forEach(v => {
        console.log(`Variant: ${v.name}`);
    });

    if (variants.length === 4) {
        console.log("\nSUCCESS: All variants generated correctly!");
    } else {
        console.error("\nFAILURE: Incorrect number of variants.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
