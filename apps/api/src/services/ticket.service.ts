import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { CreateTicketInput } from "../validators/ticket.validator";

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
    assignee: {
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
  },
  },
  });
}