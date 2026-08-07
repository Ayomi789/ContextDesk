import { Request, Response, NextFunction } from "express";
import { createMessageSchema } from "../validators/message.validator";
import { createMessage, getMessagesByTicket, } from "../services/message.service";

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createMessageSchema.parse(req.body);

    const message = await createMessage(
            data,
            req.user.userId
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
    const messages = await getMessagesByTicket(req.params.ticketId);

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
}