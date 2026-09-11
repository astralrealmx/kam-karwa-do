import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWorkerApi } from "@/lib/auth/session";
import type { Prisma } from "@prisma/client";

type Scope = "available" | "nearby" | "accepted" | "active" | "completed";

// Shared shape returned for every scope. For "available"/"nearby" tasks
// (not yet assigned to this worker), only an approximate area is
// included — never the exact formatted address, pincode, or
// coordinates. Those only appear once the task is assigned to this
// worker (accepted/active/completed), matching the Phase 1 privacy rule.
function serializeTask(
  task: Prisma.TaskGetPayload<{
    include: { category: true; address: { include: { city: true; area: true } } };
  }>,
  revealExactAddress: boolean
) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    categoryName: task.category?.nameEn ?? null,
    budget: task.budget,
    createdAt: task.createdAt.toISOString(),
    acceptedAt: task.acceptedAt?.toISOString() ?? null,
    startedAt: task.startedAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    approximateArea:
      [task.address?.area?.name, task.address?.city?.name].filter(Boolean).join(", ") ||
      null,
    exactAddress: revealExactAddress ? task.address?.formatted ?? null : null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireWorkerApi();
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const scopeParam = req.nextUrl.searchParams.get("scope");
  const scope: Scope = (
    ["available", "nearby", "accepted", "active", "completed"] as const
  ).includes(scopeParam as Scope)
    ? (scopeParam as Scope)
    : "available";

  const include = {
    category: true,
    address: { include: { city: true, area: true } },
  } as const;

  if (scope === "accepted" || scope === "active" || scope === "completed") {
    const statusMap = { accepted: "ACCEPTED", active: "ACTIVE", completed: "COMPLETED" } as const;
    const tasks = await prisma.task.findMany({
      // Always scoped to assignedWorkerId = this worker's own id — a
      // worker can never list another worker's assigned tasks.
      where: { assignedWorkerId: user.id, status: statusMap[scope] },
      include,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      scope,
      tasks: tasks.map((t) => serializeTask(t, true)),
    });
  }

  // "available" / "nearby" — the open pool, not yet assigned to anyone.
  const profile = await prisma.workerProfile.findUnique({
    where: { userId: user.id },
    include: { categories: true, location: true },
  });

  const categoryIds = profile?.categories.map((c) => c.id) ?? [];

  const where: Prisma.TaskWhereInput = {
    status: "PENDING",
    assignedWorkerId: null,
    ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
  };

  if (scope === "nearby") {
    const cityId = profile?.location?.cityId;
    if (!cityId) {
      return NextResponse.json({ ok: true, scope, tasks: [] });
    }
    where.address = { cityId };
  }

  const tasks = await prisma.task.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    scope,
    tasks: tasks.map((t) => serializeTask(t, false)),
  });
}
