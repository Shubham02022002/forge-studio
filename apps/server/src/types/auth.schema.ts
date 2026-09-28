import { z } from "zod";
import { MAX_PASSWORD_BYTES } from "../utils/password.js";

const withinByteLimit = (value: string) =>
  Buffer.byteLength(value, "utf8") <= MAX_PASSWORD_BYTES;

const passwordTooLong = `Password must be at most ${MAX_PASSWORD_BYTES} bytes`;

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const signupSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .refine(withinByteLimit, passwordTooLong),
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(80, "Name is too long")
    .optional(),
});

export const signinSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .refine(withinByteLimit, passwordTooLong),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
