import { prisma } from "../lib/prisma";

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    include: {
      ticket: {
        select: {
          id: true,
          subject: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function markNotificationRead(
  id: string,
  userId: string
) {
  return prisma.notification.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      read: true,
    },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
}