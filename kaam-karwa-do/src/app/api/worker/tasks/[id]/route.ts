import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { category: true, address: { include: { city: true, area: true } } },
  });

  // Visible if it's still open (available to browse) OR already assigned
  // to this worker. Never visible if assigned to someone else.
  const isOpen = task && task.status === "PENDING" && !task.assignedWorkerId;
  const isMine = task && task.assignedWorkerId === user.id;

  if (!task || !(isOpen || isMine)) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      categoryName: task.category?.nameEn ?? null,
      budget: task.budget,
      approximateArea:
        [task.address?.area?.name, task.address?.city?.name].filter(Boolean).join(", ") ||
        null,
      exactAddress: isMine ? task.address?.formatted ?? null : null,
    },
  });
}

const actionSchema = z.object({
  action: z.enum(["accept", "start", "complete"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });

  if (!task) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const { action } = parsed.data;

  // Every transition is validated server-side against the task's actual
  // current state and ownership — the client's UI merely hints at what
  // should be possible, it is never trusted.
  if (action === "accept") {
    if (task.status !== "PENDING" || task.assignedWorkerId) {
      return NextResponse.json(
        { ok: false, error: "TASK_NOT_AVAILABLE" },
        { status: 409 }
      );
    }
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "ACCEPTED", assignedWorkerId: user.id, acceptedAt: new Date() },
    });
    return NextResponse.json({ ok: true, task: { id: updated.id, status: updated.status } });
  }

  if (task.assignedWorkerId !== user.id) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  if (action === "start") {
    if (task.status !== "ACCEPTED") {
      return NextResponse.json(
        { ok: false, error: "INVALID_TRANSITION" },
        { status: 409 }
      );
    }
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "ACTIVE", startedAt: new Date() },
    });
    return NextResponse.json({ ok: true, task: { id: updated.id, status: updated.status } });
  }

  if (action === "complete") {
    if (task.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "INVALID_TRANSITION" },
        { status: 409 }
      );
    }
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return NextResponse.json({ ok: true, task: { id: updated.id, status: updated.status } });
  }

  return NextResponse.json({ ok: false, error: "VALIDATION" }, { status: 400 });
}
