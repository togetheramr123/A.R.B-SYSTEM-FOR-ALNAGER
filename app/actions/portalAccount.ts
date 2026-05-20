"use server";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
import { getPortalUser } from "@/lib/portalAuth";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache"; /** * Trader Portal: Request a new account statement */
export async function requestAccountStatement(notes: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return {
    success: false,
    error: "غير مصرح"
  };
  try {
    const request = await prisma.accountStatementRequest.create({
      data: {
        partnerId: portalUser.partnerId,
        companyId: portalUser.companyId,
        notes: notes,
        status: "pending"
      }
    }); // Notify ERP Accountants
    const accountants = await prisma.user.findMany({
      where: {
        companyId: portalUser.companyId,
        role: {
          in: ["ADMIN", "ACCOUNTANT"]
        }
      }
    });
    if (accountants.length > 0) {
      await prisma.notification.createMany({
        data: accountants.map(u => ({
          title: `📄 طلب كشف حساب جديد`,
          message: `التاجر ${portalUser.name} يطلب كشف حساب. الملاحظة: ${notes}`,
          type: "info",
          userId: u.id,
          linkUrl: `/ar/accounting/statements`,
          resourceId: request.id,
          resourceModel: "AccountStatementRequest",
          companyId: portalUser.companyId
        }))
      });
    }
    revalidatePath("/portal/account");
    return {
      success: true
    };
  } catch (error) {
    console.error("Error requesting statement:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء إرسال الطلب"
    };
  }
} /** * Trader Portal: Get past statement requests */
export async function getAccountStatements() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const portalUser = await getPortalUser();
  if (!portalUser) return [];
  const statements = await prisma.accountStatementRequest.findMany({
    where: {
      partnerId: portalUser.partnerId,
      companyId: portalUser.companyId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return statements.map(s => ({
    id: s.id,
    status: s.status,
    notes: s.notes,
    responseNote: s.responseNote,
    responseFile: s.responseFile,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString()
  }));
} /** * ERP Admin: Get pending/all statement requests */
export async function getAdminStatementRequests() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session || !session.companyId) return [];
  return await prisma.accountStatementRequest.findMany({
    where: {
      companyId: session.companyId
    },
    include: {
      partner: {
        select: {
          name: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
} /** * ERP Admin: Respond to a statement request with a PDF file link/base64 */
export async function respondToStatementRequest(requestId: string, fileDataUrl: string, responseNote?: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    success: false,
    error: "غير مصرح"
  };
  try {
    await prisma.accountStatementRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: "completed",
        responseFile: fileDataUrl // In a real app, upload this to S3 and store the URL. For MVP, we can store base64 or local path. responseNote: responseNote, processedById: session.userId,
      }
    });
    revalidatePath("/[locale]/accounting/statements");
    return {
      success: true
    };
  } catch (error) {
    console.error("Error responding to statement:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء رفع الملف"
    };
  }
}