import { NextFunction, Request, Response } from "express";
import { parsePagination } from "../utils/pagination.js";
import {
  getNotifications,
  getPreferences,
  markNotificationRead,
  markAllNotificationsRead,
  notificationPrefsSchema,
  updatePreferences,
} from "../services/notification.service.js";

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pagination = parsePagination(
      req.query as { page?: string; limit?: string }
    );

    const { notifications, total } = await getNotifications(
      req.user.userId,
      { skip: pagination.skip, take: pagination.limit }
    );

    return res.json({
      success: true,
      notifications,
      total,
      page: pagination.page,
      limit: pagination.limit,
    });
  } catch (error) {
    next(error);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await markNotificationRead(
      req.params.id as string,
      req.user.userId
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPrefs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const preferences = await getPreferences(req.user.userId);

    return res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePrefs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = notificationPrefsSchema.parse(req.body);

    const preferences = await updatePreferences(
      req.user.userId,
      data
    );

    return res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await markAllNotificationsRead(req.user.userId);

    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}