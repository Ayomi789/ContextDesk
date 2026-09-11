import { NextFunction, Request, Response } from "express";
import { parsePagination } from "../utils/pagination.js";
import {
  createContactSchema,
  updateContactSchema,
} from "../validators/contact.validator.js";

import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} from "../services/contact.service.js";


export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createContactSchema.parse(req.body);

    const contact = await createContact(
      data,
      req.user.organizationId
    );

    return res.status(201).json({
      success: true,
      contact,
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

    const { contacts, total } = await getContacts(
      req.user.organizationId,
      { skip: pagination.skip, take: pagination.limit }
    );

    return res.json({
      success: true,
      contacts,
      total,
      page: pagination.page,
      limit: pagination.limit,
    });
  } catch (error) {
    next(error);
  }
}




export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const contact = await getContactById(
      req.params.id as string,
      req.user.organizationId
    );

    return res.json({
      success: true,
      contact,
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
    const data = updateContactSchema.parse(req.body);

    const contact = await updateContact(
      req.params.id as string,
      data,
      req.user.organizationId
    );

    return res.json({
      success: true,
      contact,
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
    await deleteContact(
      req.params.id as string,
      req.user.organizationId
    );

    return res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}