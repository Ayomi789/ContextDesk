import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import type { UserRole } from "@contextdesk/shared-types";

export function requireRole(...roles: UserRole[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }

    next();
  };
}
