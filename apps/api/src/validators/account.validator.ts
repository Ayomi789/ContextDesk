import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  domain: z.string().min(2).max(255),
  tier: z.string().min(2).max(50),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;