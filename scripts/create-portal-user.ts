// Script to create a test portal user for development
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    // 1. Get first company and enable portal
    const company = await prisma.company.findFirst();
    if (!company) {
        console.log('❌ No company found');
        return;
    }

    await prisma.company.update({
        where: { id: company.id },
        data: { isTraderPortalEnabled: true }
    });
    console.log(`✅ Portal enabled for: ${company.name}`);

    // 2. Get or create a partner (customer)
    let partner = await prisma.partner.findFirst({
        where: { companyId: company.id, isCustomer: true }
    });

    if (!partner) {
        partner = await prisma.partner.create({
            data: {
                name: 'تاجر تجريبي',
                phone: '01000000000',
                isCustomer: true,
                companyId: company.id,
            }
        });
        console.log(`✅ Created test partner: ${partner.name}`);
    } else {
        console.log(`✅ Using existing partner: ${partner.name}`);
    }

    // 3. Create portal user
    const hashedPassword = await bcrypt.hash('123456', 10);

    const portalUser = await prisma.portalUser.upsert({
        where: { partnerId: partner.id },
        update: {
            password: hashedPassword,
            active: true,
        },
        create: {
            username: '01000000000',
            password: hashedPassword,
            name: partner.name,
            partnerId: partner.id,
            companyId: company.id,
            canSeeDiscounts: true,
            canRequestStatement: true,
        },
    });

    console.log(`\n🎉 Portal user ready!`);
    console.log(`   Username: ${portalUser.username}`);
    console.log(`   Password: 123456`);
    console.log(`   URL: http://localhost:3000/portal/login`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
