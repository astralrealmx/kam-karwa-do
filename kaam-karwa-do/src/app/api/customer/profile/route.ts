import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerApi } from "@/lib/auth/session";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  language: z.enum(["EN", "HINGLISH"]).optional(),
});

export async function GET() {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const sessionUser = auth.user;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { customerProfile: true, settings: true },
  });

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const sessionUser = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, avatarUrl, language } = parsed.data;

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
      ...(language !== undefined ? { language } : {}),
    },
  });

  return NextResponse.json({ ok: true, user });
}
