"use server";
import { getSession } from "@/lib/auth";
import { ensureAccess } from '@/lib/access';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
export async function setEnvironment(companyType: 'demo' | 'real', locale: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const isReal = companyType === 'real';
  ;
  const company = await prisma.company.findFirst({
    where: {
      name: isReal ? 'My Real Business' : 'Demo Company (San Francisco)'
    }
  });
  if (company) {
    const cookieStore = await cookies();
    cookieStore.set('active_company_id', company.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
  }
  redirect(`/${locale}/dashboard`);
}