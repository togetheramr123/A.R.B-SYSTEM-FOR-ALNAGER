import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ لا توجد شركة في النظام.');
        process.exit(1);
    }

    const username = 'عبد العزيز';
    const password = '3030';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists by name
    const existing = await prisma.user.findFirst({ where: { name: username } });
    if (existing) {
        await prisma.user.update({
            where: { id: existing.id },
            data: {
                name: username,
                password: hashedPassword,
                role: 'ADMIN',
                companyId: company.id
            }
        });
        console.log('✅ تم تحديث حساب المدير العام');
    } else {
        await prisma.user.create({
            data: {
                email: `admin_${Date.now()}@system.local`,
                name: username,
                password: hashedPassword,
                role: 'ADMIN',
                companyId: company.id
            }
        });
        console.log('✅ تم إنشاء حساب المدير العام');
    }

    console.log(`👤 اسم المستخدم: ${username}`);
    console.log(`🔑 كلمة المرور: ${password}`);
    console.log('👑 الصلاحية: ADMIN (مدير عام)');
}

createAdmin()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
