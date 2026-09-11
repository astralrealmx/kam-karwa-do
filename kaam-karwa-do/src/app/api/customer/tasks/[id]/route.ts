import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomerApi } from "@/lib/auth/session";

const updateSchema = z.object({
  status: z.enum(["CANCELLED"]), // customers may only cancel in Phase 2
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const task = await prisma.task.findFirst({
    where: { id: params.id, customerId: user.id },
    include: { category: true, address: true },
  });

  if (!task) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, task });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireCustomerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const existing = await prisma.task.findFirst({
    where: { id: params.id, customerId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
    return NextResponse.json(
      { ok: false, error: "TASK_NOT_CANCELLABLE" },
      { status: 409 }
    );
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, task });
}
