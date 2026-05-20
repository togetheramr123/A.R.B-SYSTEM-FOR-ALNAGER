"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
export async function updatePresence() {
  var session = await getSession();
  if (!session?.userId) return;
  await prisma.user.update({
    where: {
      id: session.userId
    },
    data: {
      isOnline: true,
      lastActiveAt: new Date()
    }
  });
}
export async function cleanupOfflineUsers() {
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  await prisma.user.updateMany({
    where: {
      isOnline: true,
      lastActiveAt: {
        lt: thirtySecondsAgo
      }
    },
    data: {
      isOnline: false
    }
  });
}
export async function getChatContacts() {
  var session = await getSession();
  console.log("[CHAT DEBUG] session:", { userId: session?.userId, companyId: session?.companyId, role: session?.role });
  if (!session?.companyId || !session?.userId) {
    console.log("[CHAT DEBUG] No session companyId or userId, returning []");
    return [];
  }
  try {
    await cleanupOfflineUsers();
  } catch (e) {
    // non-critical
  }
  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      id: {
        not: session.userId
      },
      role: {
        not: 'SYSTEM'
      }
    },
    select: {
      id: true,
      name: true,
      image: true,
      isOnline: true,
      lastActiveAt: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  console.log("[CHAT DEBUG] Found users:", users.length, users.map(u => u.name));
  const unreadCounts = await prisma.chatMessage.groupBy({
    by: ['senderId'],
    where: {
      receiverId: session.userId,
      isRead: false
    },
    _count: {
      id: true
    }
  });
  const unreadMap = new Map(unreadCounts.map(c => [c.senderId, c._count.id]));
  return users.map(u => ({
    ...u,
    unreadCount: unreadMap.get(u.id) || 0
  }));
}
export async function getChatHistory(otherUserId: string, roomId?: string) {
  var session = await getSession();
  if (!session?.userId) return [];
  
  if (roomId) {
    // Group Chat History
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: roomId,
        companyId: session.companyId
      },
      include: {
        sender: { select: { name: true, image: true } },
        reactions: true
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    return messages;
  } else {
    // 1-on-1 Chat History
    await prisma.chatMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    const messages = await prisma.chatMessage.findMany({
      where: {
        companyId: session.companyId,
        OR: [{
          senderId: session.userId,
          receiverId: otherUserId
        }, {
          senderId: otherUserId,
          receiverId: session.userId
        }]
      },
      include: {
        reactions: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100
    });
    return messages;
  }
}
export async function sendChatMessage(
  receiverId: string | null, 
  content: string | null, 
  roomId?: string, 
  attachmentUrl?: string, 
  attachmentType?: string, 
  fileName?: string
) {
  var session = await getSession();
  if (!session?.companyId || !session?.userId) throw new Error('Unauthorized');
  if (!content?.trim() && !attachmentUrl) return null;

  const message = await prisma.chatMessage.create({
    data: {
      content: content || null,
      senderId: session.userId,
      receiverId: receiverId,
      roomId: roomId,
      attachmentUrl: attachmentUrl,
      attachmentType: attachmentType,
      fileName: fileName,
      companyId: session.companyId
    }
  });
  await updatePresence();
  return message;
}
export async function sendMeetingInvite(receiverIds: string[], roomName: string) {
  var session = await getSession();
  if (!session?.companyId || !session?.userId) throw new Error('Unauthorized');
  const content = `[MEETING_INVITE]${roomName}`;
  const messages = await Promise.all(receiverIds.map(receiverId => prisma.chatMessage.create({
    data: {
      content,
      senderId: session.userId!,
      receiverId,
      companyId: session.companyId
    }
  })));
  await updatePresence();
  return messages;
}

export async function addReaction(messageId: string, emoji: string) {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');

  // Upsert reaction to avoid duplicates from same user
  const existingReaction = await prisma.chatMessageReaction.findFirst({
    where: { messageId, userId: session.userId, emoji }
  });

  if (existingReaction) {
    // Toggle reaction off
    await prisma.chatMessageReaction.delete({ where: { id: existingReaction.id } });
    return { status: 'removed' };
  } else {
    // Add reaction
    await prisma.chatMessageReaction.create({
      data: {
        messageId,
        userId: session.userId,
        emoji
      }
    });
    return { status: 'added' };
  }
}

export async function getChatRooms() {
  const session = await getSession();
  if (!session?.userId) return [];

  const rooms = await prisma.chatRoom.findMany({
    where: {
      participants: {
        some: { userId: session.userId }
      }
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true, role: true } } }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  return rooms;
}

export async function createChatRoom(name: string, participantIds: string[]) {
  const session = await getSession();
  if (!session?.companyId || !session?.userId) throw new Error('Unauthorized');

  // ensure current user is included
  const allIds = Array.from(new Set([...participantIds, session.userId]));

  const room = await prisma.chatRoom.create({
    data: {
      name,
      isGroup: true,
      companyId: session.companyId,
      participants: {
        create: allIds.map(id => ({
          userId: id,
          role: id === session.userId ? 'ADMIN' : 'MEMBER'
        }))
      }
    }
  });
  return room;
}