import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const notificationPrefsSchema = z.object({
  email_new_ticket: z.boolean(),
  email_ticket_assigned: z.boolean(),
  email_customer_reply: z.boolean(),
  email_sla_warning: z.boolean(),
  email_ticket_resolved: z.boolean(),
  push_new_ticket: z.boolean(),
  push_ticket_assigned: z.boolean(),
  push_customer_reply: z.boolean(),
  push_sla_warning: z.boolean(),
  push_ticket_resolved: z.boolean(),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

const DEFAULT_PREFS: NotificationPrefs = {
  email_new_ticket: true,
  email_ticket_assigned: true,
  email_customer_reply: true,
  email_sla_warning: true,
  email_ticket_resolved: false,
  push_new_ticket: true,
  push_ticket_assigned: true,
  push_customer_reply: true,
  push_sla_warning: true,
  push_ticket_resolved: false,
};

export async function getNotifications(
  userId: string,
  pagination?: { skip: number; take: number }
) {
  const where = { userId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
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
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total };
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

export async function getPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });

  if (!user) {
    return { ...DEFAULT_PREFS };
  }

  const parsed = notificationPrefsSchema
    .partial()
    .safeParse(user.notificationPrefs ?? {});

  return {
    ...DEFAULT_PREFS,
    ...(parsed.success ? parsed.data : {}),
  };
}

export async function updatePreferences(
  userId: string,
  prefs: NotificationPrefs
) {
  await prisma.user.update({
    where: { id: userId },
    data: { notificationPrefs: prefs },
  });

  return getPreferences(userId);
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