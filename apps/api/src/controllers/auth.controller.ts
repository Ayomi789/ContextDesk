// // import { NextFunction, Request, Response } from "express";
// // import { registerSchema } from "../validators/auth.validator";
// // import { registerUser } from "../services/auth.service";
// import { NextFunction, Request, Response } from "express";
// import { loginSchema, registerSchema } from "../validators/auth.validator";
// import { loginUser, registerUser } from "../services/auth.service";





// export async function register(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const data = registerSchema.parse(req.body);

//     const user = await registerUser(data);

//     return res.status(201).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     next(error);
//   }
// }


// export async function login(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const data = loginSchema.parse(req.body);

//     const result = await loginUser(data);

//     return res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error) {
//     next(error);
//   }
// }


import { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { loginUser, registerUser } from "../services/auth.service";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data);

    return res.status(201).json({
      success: true,
      user,
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