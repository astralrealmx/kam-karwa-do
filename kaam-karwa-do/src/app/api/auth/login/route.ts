import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginPasswordSchema, normalizePhone } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const { password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });

  // Deliberately generic error for both "no such user" and "wrong
  // password" so login can't be used to enumerate registered numbers.
  const genericError = () =>
    NextResponse.json(
      { ok: false, error: "INVALID_CREDENTIALS" },
      { status: 401 }
    );

  if (!user || !user.passwordHash) {
    return genericError();
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return genericError();
  }

  if (!user.phoneVerifiedAt) {
    return NextResponse.json(
      { ok: false, error: "PHONE_NOT_VERIFIED", phone },
      { status: 403 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({ ok: true, role: user.role });
}
