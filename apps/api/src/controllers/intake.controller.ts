import { NextFunction, Request, Response } from "express";
import { intakeSchema } from "../validators/intake.validator.js";
import {
  getIntakeOrg,
  isSpam,
  submitIntake,
} from "../services/intake.service.js";

const INTAKE_SUCCESS = {
  success: true,
  message: "Thanks — your request is in. We'll be in touch.",
};

export async function preview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const organization = await getIntakeOrg(
      req.params.slug as string
    );

    return res.json({
      success: true,
      organization,
    });
  } catch (error) {
    next(error);
  }
}

export async function submit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = intakeSchema.parse(req.body);

    // Spam gets a fake success so bots learn nothing.
    if (isSpam(data)) {
      return res.json(INTAKE_SUCCESS);
    }

    await submitIntake(req.params.slug as string, data);

    return res.status(201).json(INTAKE_SUCCESS);
  } catch (error) {
    next(error);
  }
}
