import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { verifyOtpSchema, normalizePhone } from "@/lib/validation/auth";
import { handleAuthRouteError } from "@/lib/auth/errorHandling";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const { purpose, code } = parsed.data;

  try {
    const result = await verifyOtp(phone, purpose, code);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (purpose === "SIGNUP" && !user.phoneVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    return handleAuthRouteError(err, "otp-verify");
  }
}
