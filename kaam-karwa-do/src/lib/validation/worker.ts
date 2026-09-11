import { z } from "zod";

// Same Indian mobile pattern used for customers (kept in sync manually —
// see src/lib/validation/auth.ts).
const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;

export const workerSignupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy" }),
  }),
});

export type WorkerSignupInput = z.infer<typeof workerSignupSchema>;

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export const workerOnboardingSchema = z.object({
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),

  cityName: z.string().trim().min(2).max(100),
  stateName: z.string().trim().min(2).max(100),
  areaName: z.string().trim().min(1).max(100).optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationSource: z.enum(["DEVICE_GPS", "MANUAL"]).default("MANUAL"),
  radiusKm: z.number().int().min(1).max(50).default(5),

  categorySlugs: z.array(z.string()).min(1, "Choose at least one category"),
  skills: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  experienceYears: z.number().int().min(0).max(60).optional(),
  languages: z.array(z.string().trim().min(1).max(30)).max(10).default([]),

  isAvailable: z.boolean().default(false),
  workingDays: z.array(z.enum(WEEKDAYS)).default([]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),

  // Payout — see src/lib/worker/payoutProvider.ts. These raw fields exist
  // ONLY in this request payload; the API route passes them straight
  // into the DEV ONLY provider and never writes them to the database.
  payout: z
    .object({
      accountHolderName: z.string().trim().min(2).max(100),
      accountNumber: z.string().trim().min(6).max(30),
      ifsc: z.string().trim().min(4).max(15),
    })
    .optional(),

  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms of Service" }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy" }),
  }),
});

export type WorkerOnboardingInput = z.infer<typeof workerOnboardingSchema>;

export { WEEKDAYS };
