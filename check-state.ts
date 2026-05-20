import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.invoice.findUnique({ where: { id: '9d0c5153-9ef0-447a-9f32-e9b98726582a' }}).then(i => console.log(i?.state));
