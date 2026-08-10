import { NextFunction, Request, Response } from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service";

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const notifications = await getNotifications(req.user.userId);

    return res.json({
      success: true,
      notifications,
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
      req.params.id,
      req.user.userId
    );

    return res.json({
      success: true,
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