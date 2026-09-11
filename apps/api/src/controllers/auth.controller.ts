import { NextFunction, Request, Response } from "express";
import {
  googleAuthSchema,
  loginSchema,
  registerSchema,
  resendCodeSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";
import {
  googleAuth,
  loginUser,
  registerUser,
  resendVerificationCode,
  verifyEmail,
} from "../services/auth.service.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = registerSchema.parse(req.body);

    const result = await registerUser(data);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verify(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = verifyEmailSchema.parse(req.body);

    const result = await verifyEmail(data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendCode(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = resendCodeSchema.parse(req.body);

    await resendVerificationCode(data.email);

    return res.status(200).json({
      success: true,
      message: "Verification code sent",
    });
  } catch (error) {
    next(error);
  }
}

export async function google(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = googleAuthSchema.parse(req.body);

    const result = await googleAuth(data);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
}