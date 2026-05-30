"use server";
import { ensureAccess } from '@/lib/access';
import { logAuditAction } from "@/app/actions/audit";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCompanyId } from '@/lib/getCompanyId';
import { generateJournalCode } from '@/lib/autoCode';
import { getSession } from '@/lib/auth';
export async function getJournal(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  if (id === 'new') return null;
  return await prisma.journal.findUnique({
    where: {
      id
    },
    include: {
      defaultAccount: true
    }
  });
}
export async function getAllJournals() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  return await prisma.journal.findMany({
    include: {
      defaultAccount: true
    },
    orderBy: {
      code: 'asc'
    }
  });
}
export async function createJournal(data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const code = data.code || (await generateJournalCode(data.type));
  const journal = await prisma.journal.create({
    data: {
      name: data.name,
      code,
      type: data.type,
      defaultAccountId: data.defaultAccountId || null,
      companyId: await getCompanyId()
    }
  });
  await logAuditAction({
    action: "create",
    model: "journal",
    recordId: journal.id,
    recordName: journal.name,
    newValues: { name: journal.name, code: journal.code, type: journal.type },
  });
  revalidatePath('/accounting/configuration/journals');
  return journal;
}
export async function updateJournal(id: string, data: any) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  const journal = await prisma.journal.update({
    where: {
      id
    },
    data: {
      name: data.name,
      code: data.code,
      type: data.type,
      defaultAccountId: data.defaultAccountId || null
    }
  });
  await logAuditAction({
    action: "update",
    model: "journal",
    recordId: id,
    recordName: data.name,
    newValues: { name: data.name, code: data.code, type: data.type },
  });
  revalidatePath('/accounting/configuration/journals');
  revalidatePath(`/accounting/configuration/journals/${id}`);
}
export async function deleteJournal(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  await prisma.journal.delete({
    where: {
      id
    }
  });
  await logAuditAction({
    action: "delete",
    model: "journal",
    recordId: id,
    recordName: "",
  });
  revalidatePath('/accounting/configuration/journals');
}