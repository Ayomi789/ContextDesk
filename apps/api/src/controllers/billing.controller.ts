import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  confirmReference,
  frontendBase,
  getSubscription,
  getUsage,
  handleWebhook,
  initializeCheckout,
} from "../services/billing.service.js";

const initializeSchema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
});

const verifySchema = z.object({
  reference: z.string().min(1),
});

export async function status(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const organizationId = req.user.organizationId;

    const [subscription, usage] = await Promise.all([
      getSubscription(organizationId),
      getUsage(organizationId),
    ]);

    return res.json({
      success: true,
      subscription,
      usage,
      frontendBase: frontendBase(),
    });
  } catch (error) {
    next(error);
  }
}

export async function initialize(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = initializeSchema.parse(req.body);

    const checkout = await initializeCheckout(
      req.user.organizationId,
      req.user.userId,
      data.plan
    );

    return res.json({
      success: true,
      ...checkout,
    });
  } catch (error) {
    next(error);
  }
}

export async function verify(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = verifySchema.parse(req.body);

    const subscription = await confirmReference(
      req.user.organizationId,
      data.reference
    );

    return res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

export async function webhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await handleWebhook(
      req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {})),
      req.headers["x-paystack-signature"] as string | undefined,
      req.body
    );

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
