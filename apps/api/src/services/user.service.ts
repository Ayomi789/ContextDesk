import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "@contextdesk/shared-types";
import { ApiError } from "../utils/api-error.js";

export async function getUsers(
  organizationId: string,
  pagination?: { skip: number; take: number }
) {
  const where = { organizationId };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
      skip: pagination?.skip,
      take: pagination?.take,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function deleteOwnAccount(id: string) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (existing.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
        organizationId: existing.organizationId,
      },
    });

    if (adminCount <= 1) {
      throw new ApiError(
        400,
        "Cannot delete the last admin — promote someone first"
      );
    }
  }

  await prisma.$transaction([
    prisma.notification.deleteMany({
      where: { userId: id },
    }),
    prisma.message.deleteMany({
      where: { authorId: id },
    }),
    prisma.ticket.updateMany({
      where: { assigneeId: id },
      data: { assigneeId: null },
    }),
    prisma.user.delete({
      where: { id },
    }),
  ]);
}

export async function updateUserRole(
  id: string,
  role: UserRole,
  organizationId: string
) {
  const existing = await prisma.user.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (existing.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", organizationId },
    });

    if (adminCount <= 1) {
      throw new ApiError(
        400,
        "Cannot demote the last admin"
      );
    }
  }

  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function updateProfile(
  id: string,
  data: { name?: string; email?: string }
) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  if (data.email && data.email !== existing.email) {
    const taken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (taken) {
      throw new ApiError(409, "Email already in use");
    }
  }

  return prisma.user.update({
    where: { id },
    data,
    select: publicUserSelect,
  });
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.passwordHash) {
    throw new ApiError(
      400,
      "Google accounts have no password to change"
    );
  }

  const matches = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!matches) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
}