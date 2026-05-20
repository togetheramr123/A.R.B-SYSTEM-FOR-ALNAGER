import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Maximum age of a message before it gets permanently deleted
const MAX_AGE_DAYS = 40;

export async function GET(req: NextRequest) {
  try {
    // In a real production scenario, you would secure this endpoint
    // by checking an Authorization header (e.g. Bearer CRON_SECRET)
    // For now, we will allow it to run if hit via local cron service.

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);

    // Find messages older than 40 days that have attachments
    const oldMessages = await prisma.chatMessage.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        attachmentUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        attachmentUrl: true,
      },
    });

    // Delete local files first
    let deletedFiles = 0;
    const uploadDir = path.join(process.cwd(), "public");
    
    for (const msg of oldMessages) {
      if (msg.attachmentUrl && msg.attachmentUrl.startsWith("/uploads/chat/")) {
        const filePath = path.join(uploadDir, msg.attachmentUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            deletedFiles++;
          } catch (e) {
            console.error(`Failed to delete file ${filePath}`, e);
          }
        }
      }
    }

    // Now delete all messages older than 40 days from DB
    // Since reactions are cascading, they will be deleted automatically
    const deletedMessages = await prisma.chatMessage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedMessages: deletedMessages.count,
      deletedFiles,
      cutoffDate,
    });
  } catch (error) {
    console.error("Chat cleanup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
