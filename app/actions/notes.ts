"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// === جلب كل الملاحظات ===
export async function getUserNotes() {
  const session = await getSession();
  if (!session?.userId) return [];

  const notes = await prisma.userNote.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDone: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return notes.map((n) => ({
    id: n.id,
    content: n.content,
    sortOrder: n.sortOrder,
    isDone: n.isDone,
    color: n.color,
    reminderAt: n.reminderAt?.toISOString() || null,
    reminderSent: n.reminderSent,
    createdAt: n.createdAt.toISOString(),
  }));
}

// === إضافة ملاحظة جديدة ===
export async function createNote(content: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "غير مصرح" };
  if (!content.trim()) return { error: "المحتوى مطلوب" };

  // Get next sort order
  const lastNote = await prisma.userNote.findFirst({
    where: { userId: session.userId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const note = await prisma.userNote.create({
    data: {
      userId: session.userId,
      content: content.trim(),
      sortOrder: (lastNote?.sortOrder || 0) + 1,
    },
  });

  return { id: note.id, content: note.content, sortOrder: note.sortOrder };
}

// === تحديث حالة الملاحظة (تم / لم يتم) ===
export async function toggleNoteDone(noteId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "غير مصرح" };

  const note = await prisma.userNote.findFirst({
    where: { id: noteId, userId: session.userId },
  });
  if (!note) return { error: "الملاحظة غير موجودة" };

  await prisma.userNote.update({
    where: { id: noteId },
    data: { isDone: !note.isDone },
  });

  return { isDone: !note.isDone };
}

// === حذف ملاحظة ===
export async function deleteNote(noteId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "غير مصرح" };

  await prisma.userNote.deleteMany({
    where: { id: noteId, userId: session.userId },
  });

  return { success: true };
}

// === تحديث محتوى ملاحظة ===
export async function updateNoteContent(noteId: string, content: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "غير مصرح" };

  await prisma.userNote.updateMany({
    where: { id: noteId, userId: session.userId },
    data: { content: content.trim() },
  });

  return { success: true };
}

// === إضافة / تعديل تذكير ===
export async function setNoteReminder(noteId: string, reminderAt: string | null) {
  const session = await getSession();
  if (!session?.userId) return { error: "غير مصرح" };

  await prisma.userNote.updateMany({
    where: { id: noteId, userId: session.userId },
    data: {
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      reminderSent: false,
    },
  });

  return { success: true };
}

// === فحص التذكيرات المستحقة (يتم استدعاؤها من cron أو عند فتح الصفحة) ===
export async function checkDueReminders() {
  const session = await getSession();
  if (!session?.userId) return [];

  const now = new Date();

  const dueNotes = await prisma.userNote.findMany({
    where: {
      userId: session.userId,
      reminderAt: { lte: now },
      reminderSent: false,
      isDone: false,
    },
  });

  // Mark as sent
  if (dueNotes.length > 0) {
    await prisma.userNote.updateMany({
      where: { id: { in: dueNotes.map((n) => n.id) } },
      data: { reminderSent: true },
    });
  }

  return dueNotes.map((n) => ({
    id: n.id,
    content: n.content,
    reminderAt: n.reminderAt?.toISOString(),
  }));
}
