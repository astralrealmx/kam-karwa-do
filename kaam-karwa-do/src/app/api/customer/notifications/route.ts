import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerApi } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ ok: true, notifications, unreadCount });
}

const markReadSchema = z.object({
  id: z.string().optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = markReadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  if (parsed.data.markAll) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.id) {
    await prisma.notification.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
}
