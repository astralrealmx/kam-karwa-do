import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requestOtp } from "@/lib/auth/otp";
import { getOtpProvider } from "@/lib/auth/otpProvider";
import { requestOtpSchema, normalizePhone } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const { purpose } = parsed.data;

  if (purpose === "LOGIN") {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // Do not reveal whether a phone number is registered.
      return NextResponse.json({
        ok: true,
        providerIsDev: getOtpProvider().isDev,
      });
    }
  }

  const result = await requestOtp(phone, purpose);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 429 }
    );
  }

  return NextResponse.json({
    ok: true,
    providerIsDev: result.providerIsDev,
    devCode: result.devCode,
  });
}
