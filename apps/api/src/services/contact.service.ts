import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import {
  CreateContactInput,
  UpdateContactInput,
} from "../validators/contact.validator";


export async function createContact(data: CreateContactInput) {
  const existing = await prisma.contact.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existing) {
    throw new ApiError(409, "Contact already exists");
  }

  const account = await prisma.account.findUnique({
    where: {
      id: data.accountId,
    },
  });

  if (!account) {
    throw new ApiError(404, "Account not found");
  }

  return prisma.contact.create({
    data,
  });
}




export async function getContacts() {
  return prisma.contact.findMany({
    include: {
      account: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}



export async function getContactById(id: string) {
  const contact = await prisma.contact.findUnique({
    where: {
      id,
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
  data: UpdateContactInput
) {
  const existing = await prisma.contact.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Contact not found");
  }

  return prisma.contact.update({
    where: { id },
    data,
  });
}


export async function deleteContact(id: string) {
  const existing = await prisma.contact.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Contact not found");
  }

  await prisma.contact.delete({
    where: { id },
  });
}