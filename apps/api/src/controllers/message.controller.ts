import { Request, Response, NextFunction } from "express";
import { parsePagination } from "../utils/pagination.js";
import {
  createMessageSchema,
} from "../validators/message.validator.js";
import {
  createMessage,
  createCustomerMessage,
  getMessagesByTicket,
} from "../services/message.service.js";



export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createMessageSchema.parse(req.body);

    // Messages created through this authenticated endpoint
    // are always agent messages.
    const message = await createMessage(
      {
        ...data,
        senderType: "AGENT",
      },
      req.user.userId,
      req.user.organizationId
    );

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
}

export async function getByTicket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pagination = parsePagination(
      req.query as { page?: string; limit?: string }
    );

    const { messages, total } = await getMessagesByTicket(
      req.params.ticketId as string,
      req.user.organizationId,
      { skip: pagination.skip, take: pagination.limit }
    );

    return res.json({
      success: true,
      messages,
      total,
      page: pagination.page,
      limit: pagination.limit,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createMessageSchema.parse(req.body);

    const message = await createCustomerMessage(
      {
        ...data,
        senderType: "CUSTOMER",
      },
      req.user.organizationId
    );

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
}