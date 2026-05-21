import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
        await prisma.user.update({
            where: { id: admin.id },
            data: {
                name: 'عبد العزيز',
                phone: '01121466223',
                email: '01121466223'
            }
        });
        console.log("Updated admin: name=عبد العزيز, phone/email=01121466223");
    }
}
main().finally(() => prisma.$disconnect());
