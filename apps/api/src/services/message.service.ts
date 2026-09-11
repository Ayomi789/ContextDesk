import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { CreateMessageInput } from "../validators/message.validator.js";

export async function createMessage(
  data: CreateMessageInput,
  authorId: string,
  organizationId: string
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: data.ticketId,
      organizationId,
    },
    select: {
      id: true,
      subject: true,
      assigneeId: true,
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create the message
    const message = await tx.message.create({
      data: {
        ...data,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        ticket: true,
      },
    });

    // Notify the assigned agent if:
    // 1. The ticket has an assignee
    // 2. The person sending the message is NOT the assignee
    if (ticket.assigneeId && ticket.assigneeId !== authorId) {
      const isInternalNote = data.isInternalNote === true;

      await tx.notification.create({
        data: {
          userId: ticket.assigneeId,
          ticketId: ticket.id,
          type: isInternalNote
            ? "INTERNAL_NOTE"
            : "NEW_MESSAGE",
          title: isInternalNote
            ? "New internal note"
            : "New message",
          description: isInternalNote
            ? `A new internal note was added to "${ticket.subject}".`
            : `A new message was added to "${ticket.subject}".`,
        },
      });
    }

    return message;
  });

  return result;
}

export async function createCustomerMessage(
  data: CreateMessageInput,
  organizationId: string
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: data.ticketId,
      organizationId,
    },
    select: {
      id: true,
      subject: true,
      assigneeId: true,
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const message = await prisma.message.create({
    data: {
      body: data.body,
      ticketId: data.ticketId,
      isInternalNote: false,
      senderType: "CUSTOMER",
      authorId: null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      ticket: true,
    },
  });

  if (ticket.assigneeId) {
    await prisma.notification.create({
      data: {
        title: "Customer replied",
        description: `Customer replied to "${ticket.subject}".`,
        type: "CUSTOMER_REPLIED",
        userId: ticket.assigneeId,
        ticketId: ticket.id,
      },
    });
  }

  return message;
}

export async function getMessagesByTicket(
  ticketId: string,
  organizationId: string,
  pagination?: { skip: number; take: number }
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      organizationId,
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  const where = { ticketId };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.message.count({ where }),
  ]);

  return { messages, total };
}