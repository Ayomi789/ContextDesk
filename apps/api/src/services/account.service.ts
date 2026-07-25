import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { CreateAccountInput } from "../validators/account.validator";

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