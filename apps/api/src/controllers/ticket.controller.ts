import { NextFunction, Request, Response } from "express";
import { createTicketSchema } from "../validators/ticket.validator";
import { createTicket } from "../services/ticket.service";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createTicketSchema.parse(req.body);

    const ticket = await createTicket(data);

    return res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error) {
    next(error);
  }
}