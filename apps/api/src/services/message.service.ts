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
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

 return prisma.message.create({
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
}