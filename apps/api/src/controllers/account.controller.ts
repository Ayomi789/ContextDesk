import { NextFunction, Request, Response } from "express";
import { parsePagination } from "../utils/pagination.js";
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} from "../services/account.service.js";

import {
  createAccountSchema,
  updateAccountSchema,
} from "../validators/account.validator.js";



export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createAccountSchema.parse(req.body);

    const account = await createAccount(
      data,
      req.user.organizationId
    );

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
    const pagination = parsePagination(
      req.query as { page?: string; limit?: string }
    );

    const { accounts, total } = await getAccounts(
      req.user.organizationId,
      { skip: pagination.skip, take: pagination.limit }
    );

    return res.status(200).json({
      success: true,
      accounts,
      total,
      page: pagination.page,
      limit: pagination.limit,
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

    const account = await updateAccount(
      req.params.id as string,
      data,
      req.user.organizationId
    );

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
    await deleteAccount(
      req.params.id as string,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}