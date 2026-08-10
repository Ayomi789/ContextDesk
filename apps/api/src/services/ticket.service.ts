import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { CreateTicketInput, UpdateTicketInput, } from "../validators/ticket.validator";

// export async function createTicket(data: CreateTicketInput) {
//   const account = await prisma.account.findUnique({
//     where: {
//       id: data.accountId,
//     },
//   });

//   if (!account) {
//     throw new ApiError(404, "Account not found");
//   }

//   const contact = await prisma.contact.findUnique({
//     where: {
//       id: data.contactId,
//     },
//   });

//   if (!contact) {
//     throw new ApiError(404, "Contact not found");
//   }

//   if (data.assigneeId) {
//     const assignee = await prisma.user.findUnique({
//       where: {
//         id: data.assigneeId,
//       },
//     });

//     if (!assignee) {
//       throw new ApiError(404, "Assignee not found");
//     }
//   }

//  return prisma.ticket.create({
//   data: {
//     subject: data.subject,
//     accountId: data.accountId,
//     contactId: data.contactId,
//     assigneeId: data.assigneeId,
//     priority: data.priority,
//   },
//   include: {
//     account: true,
//     contact: true,
//     assignee: {
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//       },
//     },
//   },
// });
// }



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

  let assignee = null;

  if (data.assigneeId) {
    assignee = await prisma.user.findUnique({
      where: {
        id: data.assigneeId,
      },
    });

    if (!assignee) {
      throw new ApiError(404, "Assignee not found");
    }
  }

  const ticket = await prisma.ticket.create({
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

  // Create a notification for the assigned agent.
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

  return ticket;
}



export async function getTickets(filters: {
  status?: string;
  priority?: string;
  assigneeId?: string;
}) {
  const where: Prisma.TicketWhereInput = {};

  if (filters.status) {
    where.status = filters.status as any;
  }

  if (filters.priority) {
    where.priority = filters.priority as any;
  }

  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  return prisma.ticket.findMany({
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
  });
}

// export async function getTicketById(id: string) {
//   const ticket = await prisma.ticket.findUnique({
//     where: {
//       id,
//     },
//     include: {
//       account: true,
//       contact: true,
//       assignee: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//     },
//   });

//   if (!ticket) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   return ticket;
// }

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

  const prevTickets = await prisma.ticket.findMany({
    where: {
      contactId: ticket.contactId,
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
    ...ticket,
    prevTickets,
  };
}


// export async function updateTicket(
//   id: string,
//   data: UpdateTicketInput
// ) {
//   const existing = await prisma.ticket.findUnique({
//     where: {
//       id,
//     },
//   });

//   if (!existing) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   if (data.assigneeId) {
//     const assignee = await prisma.user.findUnique({
//       where: {
//         id: data.assigneeId,
//       },
//     });

//     if (!assignee) {
//       throw new ApiError(404, "Assignee not found");
//     }
//   }

//   return prisma.ticket.update({
//     where: {
//       id,
//     },
//     data,
//     include: {
//       account: true,
//       contact: true,
//       assignee: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//     },
//   });
// }
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

  let newAssignee = null;

  // Only check the user when an assignee is being supplied.
  if (data.assigneeId) {
    newAssignee = await prisma.user.findUnique({
      where: {
        id: data.assigneeId,
      },
    });

    if (!newAssignee) {
      throw new ApiError(404, "Assignee not found");
    }
  }

  const updatedTicket = await prisma.ticket.update({
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

  // Create a notification only when the ticket
  // gets assigned to a different user.
  if (
    newAssignee &&
    newAssignee.id !== existing.assigneeId
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

  return updatedTicket;
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