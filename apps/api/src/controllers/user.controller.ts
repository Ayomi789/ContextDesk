import { NextFunction, Request, Response } from "express";
import { parsePagination } from "../utils/pagination.js";
import { z } from "zod";
import {
  changePassword,
  deleteOwnAccount,
  getUsers,
  updateProfile,
  updateUserRole,
} from "../services/user.service.js";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "AGENT"]),
});

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().toLowerCase().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pagination = parsePagination(
      req.query as { page?: string; limit?: string }
    );

    const { users, total } = await getUsers(
      req.user.organizationId,
      { skip: pagination.skip, take: pagination.limit }
    );

    return res.json({
      success: true,
      users,
      total,
      page: pagination.page,
      limit: pagination.limit,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteOwnAccount(req.user.userId);

    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = updateRoleSchema.parse(req.body);

    const user = await updateUserRole(
      req.params.id as string,
      data.role,
      req.user.organizationId
    );

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = updateMeSchema.parse(req.body);

    const user = await updateProfile(
      req.user.userId,
      data
    );

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = changePasswordSchema.parse(req.body);

    await changePassword(
      req.user.userId,
      data.currentPassword,
      data.newPassword
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}