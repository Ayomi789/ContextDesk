import { NextFunction, Request, Response } from "express";
// import { createAccountSchema } from "../validators/account.validator";
// import {
//   createAccount,
//   getAccounts,
// } from "../services/account.service";


import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} from "../services/account.service";

import {
  createAccountSchema,
  updateAccountSchema,
} from "../validators/account.validator";



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

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const accounts = await getAccounts();

    return res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    next(error);
  }
}


export async function update(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = updateAccountSchema.parse(req.body);

    const account = await updateAccount(req.params.id, data);

    return res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteAccount(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}