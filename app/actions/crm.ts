"use server";
import { ensureAccess } from '@/lib/access';

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export async function getTickets() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    var session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const tickets = await prisma.ticket.findMany({
      include: {
        partner: {
          select: {
            name: true
          }
        },
        assignee: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    return tickets.map(t => ({
      id: t.id,
      number: t.number,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      senderEmail: t.senderEmail,
      senderName: t.senderName,
      partnerName: t.partner?.name || null,
      assigneeName: t.assignee?.name || "غير معين",
      createdAt: t.createdAt.toISOString()
    }));
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return [];
  }
}
export async function getTicket(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  try {
    var session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const ticket = await prisma.ticket.findUnique({
      where: {
        id
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true
          }
        },
        messages: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
    return ticket;
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return null;
  }
}
export async function addTicketMessage(ticketId: string, body: string, isInternal: boolean = false) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  try {
    var session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        body,
        authorId: session.userId,
        isInternal
      }
    });
    /* Update ticket updated at timestamp */
    await prisma.ticket.update({
      where: {
        id: ticketId
      },
      data: {
        updatedAt: new Date()
      }
    });
    revalidatePath(`/[locale]/crm/tickets/${ticketId}`);
    return {
      success: true,
      message
    };
  } catch (error) {
    console.error("Failed to add message:", error);
    return {
      success: false,
      error: "فشل في إضافة الرد"
    };
  }
}
export async function updateTicketStatus(ticketId: string, status: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "write");

  try {
    var session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.ticket.update({
      where: {
        id: ticketId
      },
      data: {
        status
      }
    });
    revalidatePath(`/[locale]/crm/tickets/${ticketId}`);
    revalidatePath(`/[locale]/crm/tickets`);
    return {
      success: true
    };
  } catch (error) {
    console.error("Failed to update ticket status:", error);
    return {
      success: false,
      error: "فشل في تحديث الحالة"
    };
  }
}