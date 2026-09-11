import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  createInvitation,
  getInvitationPreview,
  listInvitations,
  revokeInvitation,
} from "../services/invitation.service.js";

const createInvitationSchema = z.object({
  email: z.email().toLowerCase(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
});

export async function create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = createInvitationSchema.parse(req.body);

    const invitation = await createInvitation(
      req.user.organizationId,
      req.user.userId,
      data
    );

    return res.status(201).json({
      success: true,
      invitation,
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
    const invitations = await listInvitations(
      req.user.organizationId
    );

    return res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    next(error);
  }
}

export async function preview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const invitation = await getInvitationPreview(
      req.params.id as string
    );

    return res.json({
      success: true,
      invitation,
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
    await revokeInvitation(
      req.user.organizationId,
      req.params.id as string
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}
