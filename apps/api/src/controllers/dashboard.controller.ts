import { NextFunction, Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service";

export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await getDashboardStats();

    return res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    next(error);
  }
}