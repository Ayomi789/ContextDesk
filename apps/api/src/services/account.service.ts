// import { prisma } from "../lib/prisma";
// import { ApiError } from "../utils/api-error";
// import { CreateAccountInput } from "../validators/account.validator";

// export async function createAccount(data: CreateAccountInput) {
//   const existing = await prisma.account.findUnique({
//     where: {
//       domain: data.domain,
//     },
//   });

//   if (existing) {
//     throw new ApiError(409, "Account already exists");
//   }

//   return prisma.account.create({
//     data,
//   });
// }

import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import {
  CreateAccountInput,
  UpdateAccountInput,
} from "../validators/account.validator";


export async function createAccount(data: CreateAccountInput) {
  const existing = await prisma.account.findUnique({
    where: {
      domain: data.domain,
    },
  });

  if (existing) {
    throw new ApiError(409, "Account already exists");
  }

  return prisma.account.create({
    data,
  });
}

export async function getAccounts() {
  return prisma.account.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}


export async function updateAccount(
  id: string,
  data: UpdateAccountInput
) {
  const existing = await prisma.account.findUnique({
    where: { id },
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

export async function deleteAccount(id: string) {
  const existing = await prisma.account.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  return prisma.account.delete({
    where: { id },
  });
}