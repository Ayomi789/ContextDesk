import { prisma } from "../lib/prisma.js";

export async function getDashboardStats(organizationId: string) {
  const totalTickets = await prisma.ticket.count({
    where: { organizationId },
  });

  const [newTickets, inProgress, waiting, resolved] =
    await Promise.all([
      prisma.ticket.count({
        where: { status: "NEW", organizationId },
      }),

      prisma.ticket.count({
        where: { status: "IN_PROGRESS", organizationId },
      }),

      prisma.ticket.count({
        where: { status: "WAITING", organizationId },
      }),

      prisma.ticket.count({
        where: { status: "RESOLVED", organizationId },
      }),
    ]);

  const priorityResults = await prisma.ticket.groupBy({
    by: ["priority"],
    where: { organizationId },
    _count: {
      id: true,
    },
  });

  const priorityMap = new Map(
    priorityResults.map((item) => [
      item.priority,
      item._count.id,
    ])
  );

  const byPriority = [
    {
      priority: "Low",
      count: priorityMap.get("LOW") ?? 0,
    },
    {
      priority: "Medium",
      count: priorityMap.get("MEDIUM") ?? 0,
    },
    {
      priority: "High",
      count: priorityMap.get("HIGH") ?? 0,
    },
    {
      priority: "Urgent",
      count: priorityMap.get("URGENT") ?? 0,
    },
  ];

  const now = new Date();

  /*
   * SLA
   *
   * Only unresolved tickets participate in SLA calculations.
   */
  const unresolvedTickets = {
    organizationId,
    status: {
      not: "RESOLVED" as const,
    },
    slaDueAt: {
      not: null,
    },
  };

  // SLA already breached.
  const slaAtRisk = await prisma.ticket.count({
    where: {
      ...unresolvedTickets,
      slaDueAt: {
        lt: now,
      },
    },
  });

  // Tickets whose SLA is due within the next 2 hours.
  const twoHoursFromNow = new Date(
    now.getTime() + 2 * 60 * 60 * 1000
  );

  const slaDueSoon = await prisma.ticket.count({
    where: {
      ...unresolvedTickets,
      slaDueAt: {
        gte: now,
        lte: twoHoursFromNow,
      },
    },
  });

  // Remaining unresolved tickets that are currently within SLA.
  const slaOnTrack = await prisma.ticket.count({
    where: {
      ...unresolvedTickets,
      slaDueAt: {
        gt: twoHoursFromNow,
      },
    },
  });

  /*
   * Ticket volume over the last 7 days.
   */
  const volumeOverTime = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date(now);

    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const count = await prisma.ticket.count({
      where: {
        organizationId,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

    volumeOverTime.push({
      date: start.toISOString(),
      count,
    });
  }

  return {
    total_tickets: totalTickets,

    new_tickets: newTickets,

    in_progress: inProgress,

    waiting,

    resolved,

    /*
     * SLA metrics
     */
    sla_at_risk: slaAtRisk,

    sla_due_soon: slaDueSoon,

    sla_on_track: slaOnTrack,

    by_priority: byPriority,

    volume_over_time: volumeOverTime,
  };
}

export async function getSlaTickets(organizationId: string) {
  const now = new Date();

  const twoHoursFromNow = new Date(
    now.getTime() + 2 * 60 * 60 * 1000
  );

  const tickets = await prisma.ticket.findMany({
    where: {
      organizationId,
      status: {
        not: "RESOLVED",
      },
      slaDueAt: {
        not: null,
      },
      OR: [
        // Already breached
        {
          slaDueAt: {
            lt: now,
          },
        },

        // Due within the next 2 hours
        {
          slaDueAt: {
            gte: now,
            lte: twoHoursFromNow,
          },
        },
      ],
    },

    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      slaDueAt: true,
      createdAt: true,

      account: {
        select: {
          id: true,
          name: true,
        },
      },

      contact: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      slaDueAt: "asc",
    },
  });

  return tickets.map((ticket) => ({
    ...ticket,

    slaStatus:
      ticket.slaDueAt && ticket.slaDueAt < now
        ? "BREACHED"
        : "DUE_SOON",
  }));
}