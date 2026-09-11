import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requestOtp } from "@/lib/auth/otp";
import { signupSchema, normalizePhone } from "@/lib/validation/auth";
import { handleAuthRouteError } from "@/lib/auth/errorHandling";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, password, acceptedTerms, acceptedPrivacy } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : undefined;

  try {
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
        role: "CUSTOMER",
        acceptedTermsAt: acceptedTerms ? now : null,
        acceptedPrivacyAt: acceptedPrivacy ? now : null,
        customerProfile: { create: {} },
        settings: { create: {} },
      },
    });

    const otpResult = await requestOtp(phone, "SIGNUP", user.id);

    return NextResponse.json({
      ok: true,
      phone,
      providerIsDev: otpResult.providerIsDev,
      devCode: otpResult.devCode,
    });
  } catch (err) {
    // Every failure path here is caught, logged in full server-side
    // (console.error/warn — check your terminal / hosting provider's
    // logs), and turned into a safe, specific error code for the
    // client. Nothing sensitive is ever sent to the browser. See
    // src/lib/auth/errorHandling.ts for the full classification.
    return handleAuthRouteError(err, "signup");
  }
}
