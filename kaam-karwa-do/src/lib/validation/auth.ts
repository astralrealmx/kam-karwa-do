import { z } from "zod";

// Indian mobile numbers: 10 digits, optionally prefixed with +91.
// Validated against the NORMALIZED digits-only form so that formatting
// a user might reasonably type — spaces, dashes, a leading "+91 " — is
// accepted rather than spuriously rejected. (The phone input's own
// placeholder shows "98765 43210" with a space, so the raw string is
// never guaranteed to already be digits-only.)
const phoneRegex = /^[6-9]\d{9}$/;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

const phoneField = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .transform((val) => normalizePhone(val))
  .refine((val) => phoneRegex.test(val), {
    message: "Enter a valid 10-digit Indian mobile number",
  });

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  phone: phoneField,
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy" }),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginPasswordSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, "Password is required"),
});

export const requestOtpSchema = z.object({
  phone: phoneField,
  purpose: z.enum(["SIGNUP", "LOGIN"]),
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  purpose: z.enum(["SIGNUP", "LOGIN"]),
  code: z.string().length(6, "Enter the 6-digit code"),
});
