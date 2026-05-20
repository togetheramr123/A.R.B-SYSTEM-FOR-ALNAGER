"use server";

import { ensureAccess } from '@/lib/access';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';

export async function getAllContractTemplates() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read"); // or some other role

  return await prisma.contractTemplate.findMany({
    include: {
      clauses: {
        orderBy: { sequence: 'asc' }
      },
      company: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getContractTemplate(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "read");

  return await prisma.contractTemplate.findUnique({
    where: { id },
    include: {
      clauses: {
        orderBy: { sequence: 'asc' }
      }
    }
  });
}

export async function createContractTemplate(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  const template = await prisma.contractTemplate.create({
    data: {
      name: data.name,
      companyId: data.companyId || null,
      clauses: {
        create: data.clauses.map((c: any, i: number) => ({
          title: c.title,
          content: c.content,
          sequence: c.sequence || (i + 1) * 10
        }))
      }
    }
  });
  revalidatePath('/hr/contracts/templates');
  return template;
}

export async function updateContractTemplate(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  // Since clauses might be added/removed, easiest is delete all and recreate
  // or use an upsert loop. Let's delete all and recreate for simplicity.
  await prisma.contractTemplateClause.deleteMany({
    where: { templateId: id }
  });

  const template = await prisma.contractTemplate.update({
    where: { id },
    data: {
      name: data.name,
      companyId: data.companyId || null,
      clauses: {
        create: data.clauses.map((c: any, i: number) => ({
          title: c.title,
          content: c.content,
          sequence: c.sequence || (i + 1) * 10
        }))
      }
    }
  });
  revalidatePath('/hr/contracts/templates');
  return template;
}

export async function getContractDetails(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  
  // A regular employee can view their OWN contract
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      employee: true,
      template: true,
      clauses: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  if (!contract) return null;

  // Check access: must be admin OR the employee themself
  const isAdmin = session.role === "ADMIN" || session.role === "MANAGER";
  const isOwner = contract.employee.userId === session.userId;
  
  if (!isAdmin && !isOwner) {
    throw new Error("غير مصرح بالوصول لهذا العقد");
  }

  return contract;
}

export async function getMyContract() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  
  const employee = await prisma.employee.findFirst({
    where: { userId: session.userId }
  });

  if (!employee) return null;

  return await prisma.contract.findFirst({
    where: { employeeId: employee.id },
    include: {
      employee: true,
      template: true,
      clauses: {
        orderBy: { sequence: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function saveContractClauses(id: string, clauses: any[], templateId?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("employee", "write");

  await prisma.contractClause.deleteMany({
    where: { contractId: id }
  });

  await prisma.contract.update({
    where: { id },
    data: {
      templateId: templateId || undefined,
      clauses: {
        create: clauses.map((c: any, i: number) => ({
          title: c.title,
          content: c.content,
          sequence: c.sequence || (i + 1) * 10
        }))
      }
    }
  });
  
  revalidatePath(`/hr/contracts`);
  revalidatePath(`/hr/contracts/${id}/editor`);
}
