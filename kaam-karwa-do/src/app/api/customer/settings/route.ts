import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerApi } from "@/lib/auth/session";

const updateSchema = z.object({
  language: z.enum(["EN", "HINGLISH"]).optional(),
  locationPreference: z.enum(["DEVICE_GPS", "MANUAL"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const settings = await prisma.platformSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  const settings = await prisma.platformSetting.upsert({
    where: { userId: user.id },
    update: parsed.data,
    create: { userId: user.id, ...parsed.data },
  });

  // Keep User.language in sync since it's used for server-rendered
  // strings (e.g. the initial cookie-based language on layout.tsx).
  if (parsed.data.language) {
    await prisma.user.update({
      where: { id: user.id },
      data: { language: parsed.data.language },
    });
  }

  return NextResponse.json({ ok: true, settings });
}
