import { NextFunction, Request, Response } from "express";
import { createTicketSchema, updateTicketSchema, } from "../validators/ticket.validator.js";
import { createTicket, getTickets, getTicketById, updateTicket, deleteTicket,} from "../services/ticket.service.js";
import { parsePagination } from "../utils/pagination.js";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createTicketSchema.parse(req.body);

    const ticket = await createTicket(
      data,
      req.user.organizationId
    );

    return res.status(201).json({
      success: true,
      ticket,
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

    const { tickets, total } = await getTickets(
      {
        status: req.query.status as string,
        priority: req.query.priority as string,
        assigneeId: req.query.assigneeId as string,
      },
      req.user.organizationId,
      { skip: pagination.skip, take: pagination.limit }
    );

    return res.json({
      success: true,
      tickets,
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
    const ticket = await getTicketById(
      req.params.id as string,
      req.user.organizationId
    );

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
      req.params.id as string,
      data,
      req.user.organizationId
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
    await deleteTicket(
      req.params.id as string,
      req.user.organizationId
    );

    return res.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}