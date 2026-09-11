import {
  Prisma,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import {
  CreateTicketInput,
  UpdateTicketInput,
} from "../validators/ticket.validator.js";

/**
 * Default SLA duration by ticket priority.
 *
 * URGENT  = 1 hour
 * HIGH    = 4 hours
 * MEDIUM  = 8 hours
 * LOW     = 24 hours
 */
const SLA_HOURS: Record<TicketPriority, number> = {
  URGENT: 1,
  HIGH: 4,
  MEDIUM: 8,
  LOW: 24,
};

/**
 * A ticket is considered "at risk" when
 * there are two hours or less remaining.
 *
 * Matches the dashboard SLA window and the
 * frontend TicketDetail logic.
 */
const SLA_AT_RISK_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Calculate the SLA deadline for a ticket.
 */
function calculateSlaDueAt(
  priority: TicketPriority,
  from = new Date()
) {
  const hours = SLA_HOURS[priority];

  return new Date(
    from.getTime() + hours * 60 * 60 * 1000
  );
}

/**
 * Determine the current SLA state of a ticket.
 *
 * WITHIN_SLA
 *   More than 2 hours remain.
 *
 * AT_RISK
 *   2 hours or less remain.
 *
 * BREACHED
 *   SLA deadline has passed.
 *
 * RESOLVED
 *   Ticket is resolved, so active SLA monitoring stops.
 *
 * NO_SLA
 *   No SLA deadline exists.
 */
export function getSlaStatus(
  slaDueAt: Date | null,
  status: TicketStatus
) {
  if (status === TicketStatus.RESOLVED) {
    return "RESOLVED";
  }

  if (!slaDueAt) {
    return "NO_SLA";
  }

  const now = Date.now();
  const dueAt = slaDueAt.getTime();

  if (dueAt <= now) {
    return "BREACHED";
  }

  if (
    dueAt - now <= SLA_AT_RISK_WINDOW_MS
  ) {
    return "AT_RISK";
  }

  return "WITHIN_SLA";
}

/**
 * Add calculated SLA status to a ticket.
 */
function withSlaStatus<T extends {
  slaDueAt: Date | null;
  status: TicketStatus;
}>(ticket: T) {
  return {
    ...ticket,
    slaStatus: getSlaStatus(
      ticket.slaDueAt,
      ticket.status
    ),
  };
}

/**
 * Create a new ticket.
 */
export async function createTicket(
  data: CreateTicketInput,
  organizationId: string,
  opts?: { triageReason?: string }
) {
  const account = await prisma.account.findFirst({
    where: {
      id: data.accountId,
      organizationId,
    },
  });

  if (!account) {
    throw new ApiError(
      404,
      "Account not found"
    );
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: data.contactId,
      organizationId,
    },
  });

  if (!contact) {
    throw new ApiError(
      404,
      "Contact not found"
    );
  }

  if (contact.accountId !== data.accountId) {
    throw new ApiError(
      400,
      "Contact does not belong to account"
    );
  }

  let assignee = null;

  if (data.assigneeId) {
    assignee = await prisma.user.findFirst({
      where: {
        id: data.assigneeId,
        organizationId,
      },
    });

    if (!assignee) {
      throw new ApiError(
        404,
        "Assignee not found"
      );
    }
  }

  /**
   * Use MEDIUM when no priority is supplied.
   */
  const priority =
    data.priority ?? TicketPriority.MEDIUM;

  /**
   * Calculate SLA from ticket creation time.
   */
  const slaDueAt = calculateSlaDueAt(
    priority
  );

  const ticket = await prisma.ticket.create({
    data: {
      subject: data.subject,
      accountId: data.accountId,
      contactId: data.contactId,
      assigneeId: data.assigneeId,
      organizationId,

      status: data.status,
      priority,
      triageReason: opts?.triageReason ?? null,

      slaDueAt,
    },

    include: {
      account: true,
      contact: true,

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  /**
   * Create a notification for the assigned agent.
   */
  if (assignee) {
    await prisma.notification.create({
      data: {
        title: "New ticket assigned",
        description: `Ticket #${ticket.id} — ${ticket.subject}`,
        type: "TICKET_ASSIGNED",
        userId: assignee.id,
        ticketId: ticket.id,
      },
    });
  }

  return withSlaStatus(ticket);
}

/**
 * Get tickets with optional filters.
 */
export async function getTickets(
  filters: {
    status?: string;
    priority?: string;
    assigneeId?: string;
  },
  organizationId: string,
  pagination?: { skip: number; take: number }
) {
  const where: Prisma.TicketWhereInput = { organizationId };

  if (filters.status) {
    if (
      !Object.values(TicketStatus).includes(
        filters.status as TicketStatus
      )
    ) {
      throw new ApiError(
        400,
        `Invalid status filter: ${filters.status}`
      );
    }

    where.status = filters.status as TicketStatus;
  }

  if (filters.priority) {
    if (
      !Object.values(TicketPriority).includes(
        filters.priority as TicketPriority
      )
    ) {
      throw new ApiError(
        400,
        `Invalid priority filter: ${filters.priority}`
      );
    }

    where.priority =
      filters.priority as TicketPriority;
  }

  if (filters.assigneeId) {
    where.assigneeId =
      filters.assigneeId;
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,

      include: {
        account: true,
        contact: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.ticket.count({ where }),
  ]);

  /**
   * Add calculated SLA status to every ticket.
   */
  return {
    tickets: tickets.map(withSlaStatus),
    total,
  };
}

/**
 * Get a single ticket and the customer's
 * previous tickets.
 */
export async function getTicketById(
  id: string,
  organizationId: string
) {
  const ticket =
    await prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },

      include: {
        account: true,
        contact: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  if (!ticket) {
    throw new ApiError(
      404,
      "Ticket not found"
    );
  }

  const prevTickets =
    await prisma.ticket.findMany({
      where: {
        contactId: ticket.contactId,
        organizationId,

        NOT: {
          id: ticket.id,
        },
      },

      include: {
        account: true,
        contact: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return {
    ...withSlaStatus(ticket),

    prevTickets:
      prevTickets.map(withSlaStatus),
  };
}

/**
 * Update a ticket.
 */
export async function updateTicket(
  id: string,
  data: UpdateTicketInput,
  organizationId: string
) {
  const existing =
    await prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },
    });

  if (!existing) {
    throw new ApiError(
      404,
      "Ticket not found"
    );
  }

  let newAssignee = null;

  /**
   * Check the new assignee if one is supplied.
   */
  if (data.assigneeId) {
    newAssignee =
      await prisma.user.findFirst({
        where: {
          id: data.assigneeId,
          organizationId,
        },
      });

    if (!newAssignee) {
      throw new ApiError(
        404,
        "Assignee not found"
      );
    }
  }

  /**
   * Guard re-parenting: a ticket's contact must
   * belong to its account.
   */
  if (data.contactId || data.accountId) {
    const effectiveContactId =
      data.contactId ?? existing.contactId;
    const effectiveAccountId =
      data.accountId ?? existing.accountId;

    const contact = await prisma.contact.findFirst({
      where: {
        id: effectiveContactId,
        organizationId,
      },
    });

    if (!contact) {
      throw new ApiError(
        404,
        "Contact not found"
      );
    }

    const account = await prisma.account.findFirst({
      where: {
        id: effectiveAccountId,
        organizationId,
      },
    });

    if (!account) {
      throw new ApiError(
        404,
        "Account not found"
      );
    }

    if (contact.accountId !== effectiveAccountId) {
      throw new ApiError(
        400,
        "Contact does not belong to account"
      );
    }
  }

  /**
   * Build the update payload.
   */
  const updateData: Prisma.TicketUpdateInput = {
    ...data,
  };

  /**
   * Recalculate SLA when priority changes.
   */
  if (
    data.priority &&
    data.priority !== existing.priority
  ) {
    updateData.slaDueAt =
      calculateSlaDueAt(
        data.priority
      );
  }

  /**
   * If the ticket is resolved, we keep the
   * original SLA timestamp but getSlaStatus()
   * will return RESOLVED.
   */
  const updatedTicket =
    await prisma.ticket.update({
      where: {
        id,
      },

      data: updateData,

      include: {
        account: true,
        contact: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  /**
   * Create an assignment notification only
   * when the ticket is assigned to a different user.
   */
  if (
    newAssignee &&
    newAssignee.id !==
      existing.assigneeId
  ) {
    await prisma.notification.create({
      data: {
        title: "New ticket assigned",
        description: `Ticket #${updatedTicket.id} — ${updatedTicket.subject}`,
        type: "TICKET_ASSIGNED",
        userId: newAssignee.id,
        ticketId: updatedTicket.id,
      },
    });
  }

  return withSlaStatus(
    updatedTicket
  );
}

/**
 * Delete a ticket.
 */
export async function deleteTicket(
  id: string,
  organizationId: string
) {
  const ticket =
    await prisma.ticket.findFirst({
      where: {
        id,
        organizationId,
      },
    });

  if (!ticket) {
    throw new ApiError(
      404,
      "Ticket not found"
    );
  }

  await prisma.$transaction([
    prisma.notification.deleteMany({
      where: {
        ticketId: id,
      },
    }),
    prisma.message.deleteMany({
      where: {
        ticketId: id,
      },
    }),
    prisma.ticket.delete({
      where: {
        id,
      },
    }),
  ]);
}