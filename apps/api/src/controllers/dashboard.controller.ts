import { NextFunction, Request, Response } from "express";
import {
  getDashboardStats,
  getSlaTickets,
} from "../services/dashboard.service.js";

export async function getDashboard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await getDashboardStats(
      req.user.organizationId
    );

    return res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardSlaTickets(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tickets = await getSlaTickets(
      req.user.organizationId
    );

    return res.json({
      success: true,
      tickets,
    });
  } catch (error) {
    next(error);
  }
}