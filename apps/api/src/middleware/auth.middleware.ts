import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/api-error.js";
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "@contextdesk/shared-types";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    const payload = verifyToken(token) as {
      userId: string;
      role: string;
      organizationId?: string;
    };

    let organizationId = payload.organizationId;

    // Tokens issued before organizations existed carry no org.
    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { organizationId: true },
      });

      organizationId = user?.organizationId ?? undefined;
    }

    if (!organizationId) {
      throw new ApiError(401, "Unauthorized");
    }

    req.user = {
      userId: payload.userId,
      role: payload.role as UserRole,
      organizationId,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, "Invalid or expired token"));
    }
  }
}