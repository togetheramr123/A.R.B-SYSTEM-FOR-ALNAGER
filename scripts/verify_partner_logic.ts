
const { getPartner } = require('./app/actions/partner');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partner = await prisma.partner.findFirst();
    if (!partner) {
        console.log("No partners found.");
        return;
    }
    console.log(`Checking partner: ${partner.name} (${partner.id})`);

    try {
        const data = await getPartner(partner.id);
        console.log("Partner Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error fetching partner:", e);
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
