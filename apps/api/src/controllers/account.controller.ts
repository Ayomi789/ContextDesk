import { NextFunction, Request, Response } from "express";
import { createAccountSchema } from "../validators/account.validator";
import { createAccount } from "../services/account.service";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
  const data = createAccountSchema.parse(req.body);

  const account = await createAccount(data);

  return res.status(201).json({
    success: true,
    account,
  });
} catch (error) {
  next(error);
}
}

