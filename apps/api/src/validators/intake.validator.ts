import { z } from "zod";

export const intakeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email().toLowerCase(),
  subject: z.string().min(3).max(200),
  message: z.string().min(1).max(5000),

  // Honeypot: real users never fill this.
  website: z.string().max(500).optional(),

  // Render timestamp (ms) for minimum fill-time check.
  startedAt: z.number().int().positive().optional(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
