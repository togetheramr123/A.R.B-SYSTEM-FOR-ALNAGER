import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Prepare upload directory
    const uploadDir = path.join(process.cwd(), "public/uploads/chat");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique file name
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = path.extname(file.name) || "";
    const uniqueName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Save file locally
    fs.writeFileSync(filePath, buffer);

    // Determine type
    let attachmentType = "file";
    if (file.type.startsWith("image/")) attachmentType = "image";
    else if (file.type.startsWith("audio/") || file.type.startsWith("video/")) attachmentType = "audio"; // video treated as audio for simplicity if from voice recorder

    // Return the URL
    const fileUrl = `/uploads/chat/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      type: attachmentType,
      fileName: file.name
    });
  } catch (error) {
    console.error("Chat upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
