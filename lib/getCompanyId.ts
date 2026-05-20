import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function getCompanyId(): Promise<string> {
    const session = await getSession();
    if (session?.companyId) return session.companyId;
    // Fallback: first company
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found in database');
    return company.id;
}
