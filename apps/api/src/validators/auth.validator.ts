import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .email("Invalid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  organizationName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100)
    .optional(),

  inviteToken: z.string().min(10).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: z.email().toLowerCase(),
  code: z
    .string()
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendCodeSchema = z.object({
  email: z.email().toLowerCase(),
});

export type ResendCodeInput = z.infer<typeof resendCodeSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),

  organizationName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100)
    .optional(),

  inviteToken: z.string().min(10).optional(),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;