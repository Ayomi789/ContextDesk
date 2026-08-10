import { NextFunction, Request, Response } from "express";
import { getUsers } from "../services/user.service";

export async function getAllUsers(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await getUsers();

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
}