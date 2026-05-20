"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createPortalSession, logoutPortal } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
export async function portalLogin(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  if (!username || !password) {
    return {
      error: "يرجى إدخال اسم المستخدم وكلمة المرور"
    };
  }
  try {
    const portalUser = await prisma.portalUser.findUnique({
      where: {
        username
      },
      include: {
        company: {
          select: {
            id: true,
            isTraderPortalEnabled: true
          }
        }
      }
    });
    if (!portalUser) {
      return {
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      };
    }
    if (!portalUser.active) {
      return {
        error: "هذا الحساب غير مفعّل. تواصل مع الشركة"
      };
    }
    if (!portalUser.company?.isTraderPortalEnabled) {
      return {
        error: "خدمة البوابة غير متاحة حالياً"
      };
    }
    const passwordsMatch = await bcrypt.compare(password, portalUser.password);
    if (!passwordsMatch) {
      return {
        error: "اسم المستخدم أو كلمة المرور غير صحيحة"
      };
    }
    /* Update last login */
    await prisma.portalUser.update({
      where: {
        id: portalUser.id
      },
      data: {
        lastLogin: new Date()
      }
    });
    /* Create portal session */
    await createPortalSession(portalUser.id, portalUser.partnerId, portalUser.companyId);
  } catch (error) {
    console.error("Portal login error:", error);
    return {
      error: "حدث خطأ غير متوقع"
    };
  }
  redirect("/portal");
}
export async function portalLogout() {
  await logoutPortal();
  redirect("/portal/login");
}