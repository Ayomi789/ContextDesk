import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { CreateTicketInput, UpdateTicketInput, } from "../validators/ticket.validator";

export async function createTicket(data: CreateTicketInput) {
  const account = await prisma.account.findUnique({
    where: {
      id: data.accountId,
    },
  });

  if (!account) {
    throw new ApiError(404, "Account not found");
  }

  const contact = await prisma.contact.findUnique({
    where: {
      id: data.contactId,
    },
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  if (data.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: {
        id: data.assigneeId,
      },
    });

    if (!assignee) {
      throw new ApiError(404, "Assignee not found");
    }
  }

 return prisma.ticket.create({
  data: {
    subject: data.subject,
    accountId: data.accountId,
    contactId: data.contactId,
    assigneeId: data.assigneeId,
    priority: data.priority,
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
}



export async function getTickets() {
  return prisma.ticket.findMany({
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
}


export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id,
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
    throw new ApiError(404, "Ticket not found");
  }

  return ticket;
}



export async function updateTicket(
  id: string,
  data: UpdateTicketInput
) {
  const existing = await prisma.ticket.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Ticket not found");
  }

  if (data.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: {
        id: data.assigneeId,
      },
    });

    if (!assignee) {
      throw new ApiError(404, "Assignee not found");
    }
  }

  return prisma.ticket.update({
    where: {
      id,
    },
    data,
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
}

export async function deleteTicket(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id,
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  await prisma.ticket.delete({
    where: {
      id,
    },
  });
}