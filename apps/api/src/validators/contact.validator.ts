import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  notes: z.string().optional(),
  accountId: z.string(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;


export const updateContactSchema = createContactSchema.partial();

export type UpdateContactInput = z.infer<typeof updateContactSchema>;