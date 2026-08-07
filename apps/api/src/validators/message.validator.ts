import { z } from "zod";

export const createMessageSchema = z.object({
  body: z.string().min(1),
  ticketId: z.string().cuid(),
  isInternalNote: z.boolean().optional(),
});

export type CreateMessageInput = z.infer<
  typeof createMessageSchema
>;