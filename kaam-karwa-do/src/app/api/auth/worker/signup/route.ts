import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requestOtp } from "@/lib/auth/otp";
import { workerSignupSchema } from "@/lib/validation/worker";
import { normalizePhone } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = workerSignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, password, acceptedTerms, acceptedPrivacy } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : undefined;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });

  if (existing) {
    return NextResponse.json(
      { ok: false, error: "ALREADY_EXISTS" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      passwordHash,
      role: "WORKER",
      acceptedTermsAt: acceptedTerms ? now : null,
      acceptedPrivacyAt: acceptedPrivacy ? now : null,
      // The WorkerProfile itself (skills/location/availability/
      // verification/payout) is created in /api/worker/onboarding once
      // the worker has verified their phone and completes the profile
      // steps — not here, so a half-filled profile never exists.
    },
  });

  const otpResult = await requestOtp(phone, "SIGNUP", user.id);

  return NextResponse.json({
    ok: true,
    phone,
    providerIsDev: otpResult.providerIsDev,
    devCode: otpResult.devCode,
  });
}
