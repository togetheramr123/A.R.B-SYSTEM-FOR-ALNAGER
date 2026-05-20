import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let senderEmail = '';
    let senderName = '';
    let subject = '';
    let bodyText = '';

    if (contentType.includes('application/json')) {
      const json = await req.json();
      senderEmail = json.from_email || json.sender || '';
      senderName = json.from_name || '';
      subject = json.subject || 'بدون عنوان';
      bodyText = json.text || json.html || '';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const from = formData.get('from') as string;
      const parsedFrom = parseEmail(from);
      senderEmail = parsedFrom.email;
      senderName = parsedFrom.name;
      subject = (formData.get('subject') as string) || 'بدون عنوان';
      bodyText = (formData.get('text') as string) || (formData.get('html') as string) || '';
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
    }

    if (!senderEmail) {
      return NextResponse.json({ error: 'Missing sender email' }, { status: 400 });
    }

    // Check if the subject contains a Ticket Number like [TKT-2026-0001]
    const ticketRegex = /\[(TKT-\d{4}-\d+)\]/;
    const match = subject.match(ticketRegex);
    let ticketId = null;
    let isNewTicket = false;

    if (match && match[1]) {
      const ticketNumber = match[1];
      const existingTicket = await prisma.ticket.findUnique({ where: { number: ticketNumber } });
      if (existingTicket) {
        ticketId = existingTicket.id;
      }
    }

    // Try to link to an existing partner/customer
    const partner = await prisma.partner.findFirst({ where: { email: senderEmail } });

    if (!ticketId) {
      // Create a new Ticket
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const ticketNumber = `TKT-${new Date().getFullYear()}-${randNum}`;
      const newTicket = await prisma.ticket.create({
        data: {
          number: ticketNumber,
          subject: subject,
          description: bodyText,
          senderEmail: senderEmail,
          senderName: senderName,
          partnerId: partner?.id || null,
          status: 'open',
          priority: 'normal',
        },
      });
      ticketId = newTicket.id;
      isNewTicket = true;
    }

    // Add message to the ticket
    if (!isNewTicket && ticketId) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticketId,
          body: bodyText,
        },
      });
      // Re-open ticket if it was closed
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'open', updatedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, ticketId, isNewTicket });
  } catch (error) {
    console.error('Error processing incoming email webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function parseEmail(fromStr: string) {
  if (!fromStr) return { name: '', email: '' };
  const match = fromStr.match(/(.*)<(.*)>/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  }
  return { name: '', email: fromStr.trim() };
}
