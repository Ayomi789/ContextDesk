import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import {
  CreateAccountInput,
  UpdateAccountInput,
} from "../validators/account.validator.js";


export async function createAccount(
  data: CreateAccountInput,
  organizationId: string
) {
  const existing = await prisma.account.findUnique({
    where: {
      domain: data.domain,
    },
  });

  if (existing) {
    throw new ApiError(409, "Account already exists");
  }

  return prisma.account.create({
    data: {
      ...data,
      organizationId,
    },
  });
}

export async function getAccounts(
  organizationId: string,
  pagination?: { skip: number; take: number }
) {
  const where = { organizationId };

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.account.count({ where }),
  ]);

  return { accounts, total };
}


export async function updateAccount(
  id: string,
  data: UpdateAccountInput,
  organizationId: string
) {
  const existing = await prisma.account.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  if (data.domain && data.domain !== existing.domain) {
    const domainExists = await prisma.account.findUnique({
      where: {
        domain: data.domain,
      },
    });

    if (domainExists) {
      throw new ApiError(409, "Account domain already exists");
    }
  }

  return prisma.account.update({
    where: { id },
    data,
  });
}

export async function deleteAccount(
  id: string,
  organizationId: string
) {
  const existing = await prisma.account.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  const [contactCount, ticketCount] = await Promise.all([
    prisma.contact.count({
      where: { accountId: id, organizationId },
    }),
    prisma.ticket.count({
      where: { accountId: id, organizationId },
    }),
  ]);

  if (contactCount > 0 || ticketCount > 0) {
    throw new ApiError(
      400,
      "Cannot delete account with existing contacts or tickets"
    );
  }

  return prisma.account.delete({
    where: { id },
  });
}