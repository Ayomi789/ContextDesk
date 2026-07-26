import { NextFunction, Request, Response } from "express";
import {
  createContactSchema,
  updateContactSchema,
} from "../validators/contact.validator";

import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} from "../services/contact.service";


export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createContactSchema.parse(req.body);

    const contact = await createContact(data);

    return res.status(201).json({
      success: true,
      contact,
    });
  } catch (error) {
    next(error);
  }
}


export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const contacts = await getContacts();

    return res.json({
      success: true,
      contacts,
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
    const contact = await getContactById(req.params.id);

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

    const contact = await updateContact(req.params.id, data);

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
    await deleteContact(req.params.id);

    return res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}