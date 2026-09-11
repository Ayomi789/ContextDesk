import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  domain: z.string().min(2).max(255),
  tier: z.string().min(2).max(50),
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().min(2).max(255).optional(),
  tier: z.string().min(2).max(50).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;