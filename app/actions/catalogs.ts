"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'catalogs');
export async function uploadCatalog(formData: FormData) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string || 'general';
  if (!file || !title) {
    return {
      error: 'العنوان والملف مطلوبان'
    };
  }
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.xls', '.docx', '.doc'];
  const ALLOWED_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIMES.includes(file.type)) {
    return {
      error: 'نوع الملف غير مسموح. الأنواع المسموحة: PDF, صور, Excel, Word'
    };
  }
  if (file.size > 20 * 1024 * 1024) {
    return {
      error: 'حجم الملف يتجاوز الحد الأقصى (20 ميجابايت)'
    };
  }
  try {
    await mkdir(UPLOAD_DIR, {
      recursive: true
    });
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    const catalog = await prisma.catalog.create({
      data: {
        title,
        description: description || null,
        fileName: file.name,
        filePath: `/uploads/catalogs/${fileName}`,
        fileSize: file.size,
        category,
        uploadedBy: session.userId,
        companyId: session.companyId
      }
    });
    try {
      revalidatePath('/[locale]/catalogs');
    } catch (error) { console.error("Silent error caught in app/actions/catalogs.ts:", error); }
    return {
      success: true,
      catalog
    };
  } catch (e: any) {
    console.error('[uploadCatalog] Error:', e);
    return {
      error: e.message || 'فشل في رفع الملف'
    };
  }
}
export async function getCatalogs() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    var session = await getSession();
    if (!session) return [];
    return prisma.catalog.findMany({
      where: {
        active: true
      },
      orderBy: [{
        sortOrder: 'asc'
      }, {
        createdAt: 'desc'
      }]
    });
  } catch (e) {
    console.error('[getCatalogs] Error:', e);
    return [];
  }
}
export async function deleteCatalog(catalogId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const catalog = await prisma.catalog.findUnique({
    where: {
      id: catalogId
    }
  });
  if (!catalog) return {
    error: 'الكتالوج غير موجود'
  };
  try {
    const fullPath = path.join(process.cwd(), 'public', catalog.filePath);
    await unlink(fullPath);
  } catch (error) { console.error("Silent error caught in app/actions/catalogs.ts:", error); }
  await prisma.catalog.delete({
    where: {
      id: catalogId
    }
  });
  try {
    revalidatePath('/[locale]/catalogs');
  } catch (error) { console.error("Silent error caught in app/actions/catalogs.ts:", error); }
  return {
    success: true
  };
}
export async function updateCatalogOrder(catalogId: string, sortOrder: number) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await prisma.catalog.update({
    where: {
      id: catalogId
    },
    data: {
      sortOrder
    }
  });
  try {
    revalidatePath('/[locale]/catalogs');
  } catch (error) { console.error("Silent error caught in app/actions/catalogs.ts:", error); }
  return {
    success: true
  };
}