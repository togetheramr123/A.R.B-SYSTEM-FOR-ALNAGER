import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const model = searchParams.get('model');
    const recordId = searchParams.get('recordId');

    if (!model || !recordId) {
      return NextResponse.json({ attachments: [] });
    }

    const where: any = {};
    switch (model) {
      case 'product': where.productId = recordId; break;
      case 'saleOrder': where.saleOrderId = recordId; break;
      case 'purchaseOrder': where.purchaseOrderId = recordId; break;
      case 'invoice': where.invoiceId = recordId; break;
      case 'stockMove': where.stockMoveId = recordId; break;
      case 'payment': where.paymentId = recordId; break;
      default: return NextResponse.json({ attachments: [] });
    }

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error("Fetch attachments error:", error);
    return NextResponse.json({ attachments: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const model = formData.get('model') as string | null;
    const recordId = formData.get('recordId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename to avoid conflicts
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    const fileUrl = `/uploads/${uniqueFilename}`;

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    // Save attachment record in DB
    const attachmentData: any = {
      fileName: file.name,
      fileUrl: fileUrl,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    };

    // If model and recordId are provided, link it to the specific record
    if (model && recordId) {
      switch (model) {
        case 'product': attachmentData.productId = recordId; break;
        case 'saleOrder': attachmentData.saleOrderId = recordId; break;
        case 'purchaseOrder': attachmentData.purchaseOrderId = recordId; break;
        case 'invoice': attachmentData.invoiceId = recordId; break;
        case 'stockPicking': attachmentData.stockMoveId = recordId; break; // Note: using stockMoveId as approximation if pickingId doesn't exist on Attachment
        case 'payment': attachmentData.paymentId = recordId; break;
      }
    }

    const attachment = await prisma.attachment.create({
      data: attachmentData
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
