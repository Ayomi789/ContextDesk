import { NextFunction, Request, Response } from "express";
import { createTicketSchema, updateTicketSchema, } from "../validators/ticket.validator";
import { createTicket, getTickets, getTicketById, updateTicket, deleteTicket,} from "../services/ticket.service";

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


export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tickets = await getTickets();

    return res.json({
      success: true,
      tickets,
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
    const ticket = await getTicketById(req.params.id);

    return res.json({
      success: true,
      ticket,
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
    const data = updateTicketSchema.parse(req.body);

    const ticket = await updateTicket(
      req.params.id,
      data
    );

    return res.json({
      success: true,
      ticket,
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
    await deleteTicket(req.params.id);

    return res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}