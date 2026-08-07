import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().min(3),
  contactId: z.string(),
  accountId: z.string(),
  assigneeId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;