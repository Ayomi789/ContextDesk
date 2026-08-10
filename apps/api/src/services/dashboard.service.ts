import { prisma } from "../lib/prisma";

export async function getDashboardStats() {
  const totalTickets = await prisma.ticket.count();

  const [newTickets, inProgress, waiting, resolved] = await Promise.all([
    prisma.ticket.count({
      where: { status: "NEW" },
    }),
    prisma.ticket.count({
      where: { status: "IN_PROGRESS" },
    }),
    prisma.ticket.count({
      where: { status: "WAITING" },
    }),
    prisma.ticket.count({
      where: { status: "RESOLVED" },
    }),
  ]);

  const priorityResults = await prisma.ticket.groupBy({
    by: ["priority"],
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

  const volumeOverTime = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const count = await prisma.ticket.count({
      where: {
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
    sla_at_risk: 0,
    by_priority: byPriority,
    volume_over_time: volumeOverTime,
  };
}