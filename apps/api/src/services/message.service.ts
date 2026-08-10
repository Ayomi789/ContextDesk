// import { prisma } from "../lib/prisma";
// import { ApiError } from "../utils/api-error";
// import { CreateMessageInput } from "../validators/message.validator";

// export async function createMessage(
//   data: CreateMessageInput,
//   authorId: string
// ) {
//   const ticket = await prisma.ticket.findUnique({
//     where: {
//       id: data.ticketId,
//     },
//   });

//   if (!ticket) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   const message = await prisma.message.create({
//     data: {
//       ...data,
//       authorId,
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//       ticket: true,
//     },
//   });

//   // Public replies notify the ticket assignee.
//   // Internal notes do not create notifications.
//   if (
//     !data.isInternalNote &&
//     ticket.assigneeId &&
//     ticket.assigneeId !== authorId
//   ) {
//     await prisma.notification.create({
//       data: {
//         title: "Customer replied",
//         description: `Customer replied to Ticket #${ticket.id} — ${ticket.subject}`,
//         type: "CUSTOMER_REPLIED",
//         userId: ticket.assigneeId,
//         ticketId: ticket.id,
//       },
//     });
//   }

//   return message;
// }

// export async function getMessagesByTicket(ticketId: string) {
//   const ticket = await prisma.ticket.findUnique({
//     where: {
//       id: ticketId,
//     },
//   });

//   if (!ticket) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   return prisma.message.findMany({
//     where: {
//       ticketId,
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//   });
// }


// import { prisma } from "../lib/prisma";
// import { ApiError } from "../utils/api-error";
// import { CreateMessageInput } from "../validators/message.validator";

// export async function createMessage(
//   data: CreateMessageInput,
//   authorId: string
// ) {
//   const ticket = await prisma.ticket.findUnique({
//     where: {
//       id: data.ticketId,
//     },
//   });

//   if (!ticket) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   const senderType = data.senderType ?? "AGENT";

//   // Agent messages must have an authenticated CRM user.
//   if (senderType === "AGENT" && !authorId) {
//     throw new ApiError(401, "Agent author is required");
//   }

//   const message = await prisma.message.create({
//     data: {
//       body: data.body,
//       ticketId: data.ticketId,
//       isInternalNote: data.isInternalNote ?? false,
//       senderType,
//       authorId: senderType === "AGENT" ? authorId : null,
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//       ticket: true,
//     },
//   });

//   // Customer replies notify the assigned agent.
//   if (
//     senderType === "CUSTOMER" &&
//     ticket.assigneeId
//   ) {
//     await prisma.notification.create({
//       data: {
//         title: "Customer replied",
//         description: `Customer replied to Ticket #${ticket.id} — ${ticket.subject}`,
//         type: "CUSTOMER_REPLIED",
//         userId: ticket.assigneeId,
//         ticketId: ticket.id,
//       },
//     });
//   }

//   return message;
// }

// export async function getMessagesByTicket(ticketId: string) {
//   const ticket = await prisma.ticket.findUnique({
//     where: {
//       id: ticketId,
//     },
//   });

//   if (!ticket) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   return prisma.message.findMany({
//     where: {
//       ticketId,
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//   });
// }


// export async function createCustomerMessage(
//   data: CreateMessageInput
// ) {
//   const ticket = await prisma.ticket.findUnique({
//     where: {
//       id: data.ticketId,
//     },
//   });

//   if (!ticket) {
//     throw new ApiError(404, "Ticket not found");
//   }

//   const message = await prisma.message.create({
//     data: {
//       body: data.body,
//       ticketId: data.ticketId,
//       senderType: "CUSTOMER",
//       isInternalNote: false,
//       authorId: null,
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//       ticket: true,
//     },
//   });

//   if (ticket.assigneeId) {
//     await prisma.notification.create({
//       data: {
//         title: "Customer replied",
//         description: `Customer replied to Ticket #${ticket.id} — ${ticket.subject}`,
//         type: "CUSTOMER_REPLIED",
//         userId: ticket.assigneeId,
//         ticketId: ticket.id,
//       },
//     });
//   }

//   return message;
// }


import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { CreateMessageInput } from "../validators/message.validator";

export async function createMessage(
  data: CreateMessageInput,
  authorId: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: data.ticketId,
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

export async function getMessagesByTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  return prisma.message.findMany({
    where: {
      ticketId,
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
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}