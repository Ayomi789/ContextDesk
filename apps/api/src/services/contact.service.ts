import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import {
  CreateContactInput,
  UpdateContactInput,
} from "../validators/contact.validator.js";


export async function createContact(
  data: CreateContactInput,
  organizationId: string
) {
  const existing = await prisma.contact.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existing) {
    throw new ApiError(409, "Contact already exists");
  }

  const account = await prisma.account.findFirst({
    where: {
      id: data.accountId,
      organizationId,
    },
  });

  if (!account) {
    throw new ApiError(404, "Account not found");
  }

  return prisma.contact.create({
    data: {
      ...data,
      organizationId,
    },
    include: {
      account: true,
    },
  });
}




export async function getContacts(
  organizationId: string,
  pagination?: { skip: number; take: number }
) {
  const where = { organizationId };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.contact.count({ where }),
  ]);

  return { contacts, total };
}



export async function getContactById(
  id: string,
  organizationId: string
) {
  const contact = await prisma.contact.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      account: true,
    },
  });

  if (!contact) {
    throw new ApiError(404, "Contact not found");
  }

  return contact;
}

export async function updateContact(
  id: string,
  data: UpdateContactInput,
  organizationId: string
) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new ApiError(404, "Contact not found");
  }

  if (data.accountId && data.accountId !== existing.accountId) {
    const account = await prisma.account.findFirst({
      where: {
        id: data.accountId,
        organizationId,
      },
    });

    if (!account) {
      throw new ApiError(404, "Account not found");
    }
  }

  return prisma.contact.update({
    where: { id },
    data,
  });
}


export async function deleteContact(
  id: string,
  organizationId: string
) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new ApiError(404, "Contact not found");
  }

  const ticketCount = await prisma.ticket.count({
    where: { contactId: id, organizationId },
  });

  if (ticketCount > 0) {
    throw new ApiError(
      400,
      "Cannot delete contact with existing tickets"
    );
  }

  await prisma.contact.delete({
    where: { id },
  });
}