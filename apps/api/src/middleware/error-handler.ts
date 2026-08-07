import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

      if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    // Only unexpected errors get logged
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
}